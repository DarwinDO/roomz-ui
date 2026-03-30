import {
  ROMI_KNOWLEDGE_DOCUMENTS,
  type RomiKnowledgeDocumentSeed,
} from '../../../packages/shared/src/constants/romiKnowledge.ts';
import type { RomiKnowledgeSource, RomiViewerMode } from '../../../packages/shared/src/services/ai-chatbot/types.ts';

const AI_GATEWAY_API_KEY = Deno.env.get('AI_GATEWAY_API_KEY');
const AI_GATEWAY_EMBEDDING_MODEL = Deno.env.get('AI_GATEWAY_EMBEDDING_MODEL') || 'google/text-embedding-005';
const KNOWLEDGE_MATCH_LIMIT = 4;

type AdminClient = {
  from: (table: string) => {
    select: (columns: string, options?: Record<string, unknown>) => any;
    upsert: (values: Record<string, unknown>[] | Record<string, unknown>, options?: Record<string, unknown>) => any;
    update: (values: Record<string, unknown>) => any;
  };
  rpc: (fn: string, args?: Record<string, unknown>) => any;
};

interface KnowledgeChunkRow {
  id: string;
  chunk_id: string;
  document_id: string;
  chunk_index: number;
  section: string;
  audience: string;
  content: string;
  metadata: Record<string, unknown>;
  embedding?: string | null;
}

interface KnowledgeDocumentRow {
  id: string;
  slug: string;
  title: string;
  section: string;
  audience: string;
  summary: string | null;
}

interface KnowledgeMatchRow {
  chunk_id: string;
  document_id: string;
  document_slug: string;
  document_title: string;
  section: string;
  audience: string;
  content: string;
  summary: string | null;
  similarity: number | null;
}

function serializeEmbedding(values: number[]) {
  return `[${values.join(',')}]`;
}

async function createEmbedding(input: string) {
  if (!AI_GATEWAY_API_KEY) return null;

  const response = await fetch('https://ai-gateway.vercel.sh/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${AI_GATEWAY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: AI_GATEWAY_EMBEDDING_MODEL,
      input,
    }),
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`Knowledge embedding failed: ${payload}`);
  }

  const payload = await response.json() as { data?: Array<{ embedding?: number[] }> };
  return payload.data?.[0]?.embedding || null;
}

async function upsertDocuments(adminClient: AdminClient) {
  await adminClient
    .from('romi_knowledge_documents')
    .upsert(
      ROMI_KNOWLEDGE_DOCUMENTS.map((doc) => ({
        slug: doc.slug,
        title: doc.title,
        section: doc.section,
        audience: doc.audience,
        summary: doc.summary,
        metadata: { seed: true },
      })),
      { onConflict: 'slug' },
    );

  const { data, error } = await adminClient
    .from('romi_knowledge_documents')
    .select('id, slug, title, section, audience, summary');

  if (error) throw error;

  const rows = (data || []) as KnowledgeDocumentRow[];
  const mapping = new Map<string, KnowledgeDocumentRow>();
  for (const row of rows) {
    mapping.set(row.slug, row);
  }

  return mapping;
}

async function upsertChunks(
  adminClient: AdminClient,
  documentMapping: Map<string, KnowledgeDocumentRow>,
) {
  const chunkPayload: Array<Record<string, unknown>> = [];

  for (const document of ROMI_KNOWLEDGE_DOCUMENTS) {
    const row = documentMapping.get(document.slug);
    if (!row) continue;

    document.chunks.forEach((chunk, index) => {
      chunkPayload.push({
        document_id: row.id,
        chunk_id: `${document.slug}::${index + 1}`,
        chunk_index: index,
        section: document.section,
        audience: document.audience,
        content: chunk,
        metadata: {
          seed: true,
          documentSlug: document.slug,
          documentTitle: document.title,
        },
      });
    });
  }

  if (!chunkPayload.length) return;

  await adminClient
    .from('romi_knowledge_chunks')
    .upsert(chunkPayload, { onConflict: 'chunk_id' });
}

async function embedMissingChunks(adminClient: AdminClient) {
  if (!AI_GATEWAY_API_KEY) return;

  const { data, error } = await adminClient
    .from('romi_knowledge_chunks')
    .select('id, chunk_id, document_id, chunk_index, section, audience, content, metadata, embedding')
    .is('embedding', null)
    .limit(64);

  if (error) throw error;

  const rows = (data || []) as KnowledgeChunkRow[];
  for (const row of rows) {
    const embedding = await createEmbedding(row.content);
    if (!embedding?.length) continue;

    const { error: updateError } = await adminClient
      .from('romi_knowledge_chunks')
      .update({
        embedding: serializeEmbedding(embedding),
        updated_at: new Date().toISOString(),
      })
      .eq('id', row.id);

    if (updateError) {
      throw updateError;
    }
  }
}

function lexicalScore(query: string, candidate: string) {
  const queryTerms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 2);

  if (!queryTerms.length) return 0;

  const target = candidate.toLowerCase();
  return queryTerms.reduce((score, term) => score + (target.includes(term) ? 1 : 0), 0);
}

export async function ensureKnowledgeCorpus(adminClient: AdminClient) {
  const documentMapping = await upsertDocuments(adminClient);
  await upsertChunks(adminClient, documentMapping);
  await embedMissingChunks(adminClient);
}

function mapKnowledgeMatch(row: KnowledgeMatchRow): RomiKnowledgeSource {
  return {
    chunkId: row.chunk_id,
    documentSlug: row.document_slug,
    documentTitle: row.document_title,
    section: row.section,
    label: row.document_title,
    summary: row.summary,
    snippet: row.content,
    similarity: row.similarity,
  };
}

async function lexicalFallback(
  adminClient: AdminClient,
  query: string,
  viewerMode: RomiViewerMode,
  section?: string | null,
) {
  const { data, error } = await adminClient
    .from('romi_knowledge_chunks')
    .select(`
      chunk_id,
      section,
      audience,
      content,
      metadata,
      romi_knowledge_documents!inner (
        id,
        slug,
        title,
        summary
      )
    `)
    .limit(64);

  if (error) throw error;

  const rows = ((data || []) as Array<Record<string, unknown>>)
    .map((row) => {
      const document = row.romi_knowledge_documents as Record<string, unknown> | null;
      const chunk: KnowledgeMatchRow = {
        chunk_id: String(row.chunk_id || ''),
        document_id: String(document?.id || ''),
        document_slug: String(document?.slug || ''),
        document_title: String(document?.title || ''),
        section: String(row.section || ''),
        audience: String(row.audience || ''),
        content: String(row.content || ''),
        summary: typeof document?.summary === 'string' ? document.summary : null,
        similarity: lexicalScore(query, String(row.content || '')),
      };
      return chunk;
    })
    .filter((row) =>
      row.chunk_id
      && (row.audience === 'both' || row.audience === viewerMode)
      && (!section || row.section === section)
    )
    .sort((left, right) => (right.similarity || 0) - (left.similarity || 0))
    .slice(0, KNOWLEDGE_MATCH_LIMIT);

  return rows.map(mapKnowledgeMatch);
}

export async function retrieveKnowledgeSources(
  adminClient: AdminClient,
  query: string,
  viewerMode: RomiViewerMode,
  section?: string | null,
) {
  if (!query.trim()) return [];

  try {
    if (AI_GATEWAY_API_KEY) {
      const embedding = await createEmbedding(query);
      if (embedding?.length) {
        const { data, error } = await adminClient.rpc('match_romi_knowledge_chunks', {
          p_query_embedding: serializeEmbedding(embedding),
          p_match_limit: KNOWLEDGE_MATCH_LIMIT,
          p_section: section || null,
          p_audience: viewerMode,
        });

        if (error) throw error;

        const matches = ((data || []) as KnowledgeMatchRow[]).map(mapKnowledgeMatch);
        if (matches.length > 0) {
          return matches;
        }
      }
    }
  } catch (error) {
    console.warn('Knowledge retrieval RPC failed, falling back to lexical retrieval:', error);
  }

  return await lexicalFallback(adminClient, query, viewerMode, section);
}

export function buildKnowledgeContext(sources: RomiKnowledgeSource[]) {
  if (!sources.length) return '';

  return sources
    .map((source, index) => {
      const summary = source.summary ? `Tóm tắt: ${source.summary}` : '';
      return `[Nguồn ${index + 1}] ${source.documentTitle}\nPhần: ${source.section}\n${summary}\n${source.snippet || ''}`.trim();
    })
    .join('\n\n');
}

export function inferKnowledgeSection(requestedTopics: string[]) {
  if (!requestedTopics.length) return null;

  const topic = requestedTopics[0];
  if (topic === 'onboarding') return 'onboarding';
  if (topic === 'rommz_plus') return 'pricing';
  if (topic === 'verification') return 'verification';
  if (topic === 'roommate_matching') return 'roommates';
  if (topic === 'swap_room') return 'short_stay';
  if (topic === 'services') return 'services';
  if (topic === 'perks') return 'local_passport';
  return null;
}
