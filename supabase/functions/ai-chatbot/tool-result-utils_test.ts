import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { capToolCalls, dedupeToolResults } from './tool-result-utils.ts';

Deno.test('dedupeToolResults collapses identical tool outputs while preserving order', () => {
  const unique = dedupeToolResults([
    {
      name: 'search_locations',
      result: { locations: [{ id: 'loc-1' }, { id: 'loc-2' }] },
    },
    {
      name: 'search_locations',
      result: { locations: [{ id: 'loc-1' }, { id: 'loc-2' }] },
    },
    {
      name: 'search_locations',
      result: { locations: [{ id: 'loc-3' }] },
    },
  ]);

  assertEquals(unique, [
    {
      name: 'search_locations',
      result: { locations: [{ id: 'loc-1' }, { id: 'loc-2' }] },
    },
    {
      name: 'search_locations',
      result: { locations: [{ id: 'loc-3' }] },
    },
  ]);
});

Deno.test('capToolCalls allows calls up to maxPerSignature', () => {
  type Call = { toolName: string; args: Record<string, unknown> };
  const calls: Call[] = [
    { toolName: 'search_locations', args: { city: 'HCM' } },
    { toolName: 'search_locations', args: { city: 'HCM' } },
    { toolName: 'search_locations', args: { city: 'HCM' } },
    { toolName: 'search_locations', args: { city: 'HN' } },
  ];
  const capped = capToolCalls(calls, 2, (c) => `${c.toolName}:${JSON.stringify(c.args)}`);
  assertEquals(capped, [
    { toolName: 'search_locations', args: { city: 'HCM' } },
    { toolName: 'search_locations', args: { city: 'HCM' } },
    { toolName: 'search_locations', args: { city: 'HN' } },
  ]);
});

Deno.test('capToolCalls with maxPerSignature=1 behaves like dedup by signature', () => {
  type Call = { toolName: string; args: Record<string, unknown> };
  const calls: Call[] = [
    { toolName: 'search_deals', args: { q: 'gym' } },
    { toolName: 'search_deals', args: { q: 'gym' } },
    { toolName: 'search_deals', args: { q: 'pool' } },
  ];
  const capped = capToolCalls(calls, 1, (c) => `${c.toolName}:${JSON.stringify(c.args)}`);
  assertEquals(capped, [
    { toolName: 'search_deals', args: { q: 'gym' } },
    { toolName: 'search_deals', args: { q: 'pool' } },
  ]);
});

Deno.test('capToolCalls returns all calls when none exceed cap', () => {
  type Call = { toolName: string; args: Record<string, unknown> };
  const calls: Call[] = [
    { toolName: 'search_locations', args: { city: 'HCM' } },
    { toolName: 'search_deals', args: { q: 'gym' } },
  ];
  const capped = capToolCalls(calls, 3, (c) => `${c.toolName}:${JSON.stringify(c.args)}`);
  assertEquals(capped, calls);
});
