import {spawnSync} from "node:child_process";
import {existsSync} from "node:fs";
import {mkdir, readFile, writeFile} from "node:fs/promises";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";

import {createClient} from "@supabase/supabase-js";

import {buildRommzBrandAdPayload, type RommzBrandAdFeaturedRoom, type RommzBrandAdSnapshot} from "../../src/remotion/payloads/buildRommzBrandAdPayload.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const WEB_DIR = resolve(__dirname, "..", "..");
const ROOT_DIR = resolve(WEB_DIR, "..", "..");
const PAYLOAD_PATH = resolve(WEB_DIR, ".tmp", "remotion", "rommz-brand-ad.payload.json");

type Mode = "payload" | "render" | "still";

type Args = {
  mode: Mode;
  outputPath?: string;
  stillFrame: number;
  useFixture: boolean;
  voiceoverSrc?: string;
  soundtrackSrc?: string;
};

type CountQueryLabel =
  | "rooms.activeCount"
  | "rooms.verifiedCount"
  | "deals.activeCount"
  | "deals.premiumCount"
  | "partners.activeCount"
  | "community.activeCount";

type SupabaseRoomRow = {
  id: string;
  title: string;
  city: string | null;
  district: string | null;
  price_per_month: number;
  is_verified: boolean | null;
  favorite_count: number | null;
  view_count: number | null;
  created_at: string | null;
};

type SupabaseRoomImageRow = {
  room_id: string;
  image_url: string;
  is_primary: boolean | null;
  display_order: number | null;
};

const ENV_FILES = [
  resolve(ROOT_DIR, ".env"),
  resolve(ROOT_DIR, ".env.local"),
  resolve(WEB_DIR, ".env"),
  resolve(WEB_DIR, ".env.local"),
];

const DEFAULT_STILL_OUTPUT = "remotion-renders/rommz-brand-ad-live.png";
const DEFAULT_VIDEO_OUTPUT = "remotion-renders/rommz-brand-ad-live.mp4";

const parseArgs = (argv: string[]): Args => {
  const parsed: Args = {
    mode: "payload",
    stillFrame: 48,
    useFixture: false,
  };

  for (const entry of argv) {
    if (entry === "--render") {
      parsed.mode = "render";
      continue;
    }

    if (entry === "--still") {
      parsed.mode = "still";
      continue;
    }

    if (entry === "--payload") {
      parsed.mode = "payload";
      continue;
    }

    if (entry === "--use-fixture") {
      parsed.useFixture = true;
      continue;
    }

    if (entry.startsWith("--out=")) {
      parsed.outputPath = entry.slice("--out=".length);
      continue;
    }

    if (entry.startsWith("--frame=")) {
      const value = Number(entry.slice("--frame=".length));
      if (Number.isFinite(value) && value >= 0) {
        parsed.stillFrame = Math.floor(value);
      }
      continue;
    }

    if (entry.startsWith("--voiceover=")) {
      parsed.voiceoverSrc = entry.slice("--voiceover=".length);
      continue;
    }

    if (entry.startsWith("--soundtrack=")) {
      parsed.soundtrackSrc = entry.slice("--soundtrack=".length);
    }
  }

  return parsed;
};

const loadEnvFiles = async () => {
  for (const envFile of ENV_FILES) {
    if (!existsSync(envFile)) {
      continue;
    }

    const content = await readFile(envFile, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex <= 0) {
        continue;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  }
};

const pushWarning = (warnings: string[], label: string, error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  warnings.push(`${label}: ${message}`);
};

const getCount = async (
  label: CountQueryLabel,
  runQuery: () => Promise<{count: number | null; error: {message: string} | null}>,
  warnings: string[],
) => {
  try {
    const {count, error} = await runQuery();
    if (error) {
      throw new Error(error.message);
    }

    return count;
  } catch (error) {
    pushWarning(warnings, label, error);
    return null;
  }
};

const pickImagesByRoom = (images: SupabaseRoomImageRow[]) => {
  const grouped = new Map<string, SupabaseRoomImageRow[]>();

  for (const image of images) {
    const bucket = grouped.get(image.room_id) ?? [];
    bucket.push(image);
    grouped.set(image.room_id, bucket);
  }

  const selected = new Map<string, string>();
  for (const [roomId, bucket] of grouped.entries()) {
    bucket.sort((left, right) => {
      const leftPrimary = left.is_primary ? 0 : 1;
      const rightPrimary = right.is_primary ? 0 : 1;
      if (leftPrimary !== rightPrimary) {
        return leftPrimary - rightPrimary;
      }

      return (left.display_order ?? Number.MAX_SAFE_INTEGER) - (right.display_order ?? Number.MAX_SAFE_INTEGER);
    });
    selected.set(roomId, bucket[0]?.image_url ?? "");
  }

  return selected;
};

const loadDatabaseSnapshot = async (args: Args): Promise<RommzBrandAdSnapshot> => {
  const warnings: string[] = [];
  const capturedAt = new Date().toISOString();
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return {
      dataSource: "fixture",
      capturedAt,
      warnings: [
        "Missing SUPABASE_URL or VITE_SUPABASE_URL, and no Supabase key was available for the local render script.",
      ],
      audio: {
        voiceoverSrc: args.voiceoverSrc,
        soundtrackSrc: args.soundtrackSrc,
      },
    };
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const [
    activeRoomCount,
    verifiedRoomCount,
    activeDealCount,
    premiumDealCount,
    activePartnerCount,
    activeCommunityCount,
  ] = await Promise.all([
    getCount(
      "rooms.activeCount",
      async () =>
        await supabase.from("rooms").select("id", {count: "exact", head: true}).eq("status", "active").is("deleted_at", null),
      warnings,
    ),
    getCount(
      "rooms.verifiedCount",
      async () =>
        await supabase
          .from("rooms")
          .select("id", {count: "exact", head: true})
          .eq("status", "active")
          .is("deleted_at", null)
          .eq("is_verified", true),
      warnings,
    ),
    getCount(
      "deals.activeCount",
      async () => await supabase.from("deals").select("id", {count: "exact", head: true}).eq("is_active", true),
      warnings,
    ),
    getCount(
      "deals.premiumCount",
      async () =>
        await supabase.from("deals").select("id", {count: "exact", head: true}).eq("is_active", true).eq("is_premium_only", true),
      warnings,
    ),
    getCount(
      "partners.activeCount",
      async () => await supabase.from("partners").select("id", {count: "exact", head: true}).eq("status", "active"),
      warnings,
    ),
    getCount(
      "community.activeCount",
      async () => await supabase.from("community_posts").select("id", {count: "exact", head: true}).eq("status", "active"),
      warnings,
    ),
  ]);

  let featuredRooms: RommzBrandAdFeaturedRoom[] = [];
  try {
    const {data: rooms, error: roomsError} = await supabase
      .from("rooms")
      .select("id, title, city, district, price_per_month, is_verified, favorite_count, view_count, created_at")
      .eq("status", "active")
      .is("deleted_at", null)
      .order("created_at", {ascending: false})
      .limit(6);

    if (roomsError) {
      throw roomsError;
    }

    const roomRows = (rooms ?? []) as SupabaseRoomRow[];
    const roomIds = roomRows.map((room) => room.id);
    let imageMap = new Map<string, string>();

    if (roomIds.length > 0) {
      const {data: roomImages, error: imagesError} = await supabase
        .from("room_images")
        .select("room_id, image_url, is_primary, display_order")
        .in("room_id", roomIds);

      if (imagesError) {
        throw imagesError;
      }

      imageMap = pickImagesByRoom((roomImages ?? []) as SupabaseRoomImageRow[]);
    }

    featuredRooms = roomRows.map((room) => ({
      id: room.id,
      title: room.title,
      city: room.city,
      district: room.district,
      pricePerMonth: room.price_per_month,
      isVerified: room.is_verified ?? false,
      imageUrl: imageMap.get(room.id),
      favoriteCount: room.favorite_count,
      viewCount: room.view_count,
    }));
  } catch (error) {
    pushWarning(warnings, "rooms.featured", error);
  }

  let topCategory: string | null = null;
  try {
    const {data, error} = await supabase
      .from("partners")
      .select("category")
      .eq("status", "active")
      .not("category", "is", null)
      .limit(1);

    if (error) {
      throw error;
    }

    topCategory = data?.[0]?.category ?? null;
  } catch (error) {
    pushWarning(warnings, "partners.topCategory", error);
  }

  let topPostTitle: string | null = null;
  try {
    const {data, error} = await supabase
      .from("community_posts")
      .select("title")
      .eq("status", "active")
      .order("likes_count", {ascending: false})
      .limit(1);

    if (error) {
      throw error;
    }

    topPostTitle = data?.[0]?.title ?? null;
  } catch (error) {
    pushWarning(warnings, "community.topPostTitle", error);
  }

  const hasLiveSignals =
    featuredRooms.length > 0 ||
    [activeRoomCount, verifiedRoomCount, activeDealCount, premiumDealCount, activePartnerCount, activeCommunityCount].some(
      (value) => typeof value === "number",
    );

  return {
    dataSource: hasLiveSignals ? "database" : "fixture",
    capturedAt,
    warnings,
    rooms: {
      activeCount: activeRoomCount,
      verifiedCount: verifiedRoomCount,
      featured: featuredRooms,
    },
    deals: {
      activeCount: activeDealCount,
      premiumCount: premiumDealCount,
    },
    partners: {
      activeCount: activePartnerCount,
      topCategory,
    },
    community: {
      activeCount: activeCommunityCount,
      topPostTitle,
    },
    audio: {
      voiceoverSrc: args.voiceoverSrc,
      soundtrackSrc: args.soundtrackSrc,
    },
  };
};

const writePayloadSnapshot = async (snapshotPath: string, payload: unknown) => {
  await mkdir(dirname(snapshotPath), {recursive: true});
  await writeFile(snapshotPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
};

const runRemotionCommand = (args: Args, payloadPath: string) => {
  const command = "npx";
  const outputPath =
    args.outputPath ??
    (args.mode === "still" ? DEFAULT_STILL_OUTPUT : DEFAULT_VIDEO_OUTPUT);
  const remotionArgs =
    args.mode === "still"
      ? [
          "remotion",
          "still",
          "src/remotion/index.ts",
          "RommzBrandAd16x9",
          outputPath,
          `--props=${payloadPath}`,
          `--frame=${args.stillFrame}`,
        ]
      : [
          "remotion",
          "render",
          "src/remotion/index.ts",
          "RommzBrandAd16x9",
          outputPath,
          `--props=${payloadPath}`,
        ];

  const result = spawnSync(command, remotionArgs, {
    cwd: WEB_DIR,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

const main = async () => {
  await loadEnvFiles();

  const args = parseArgs(process.argv.slice(2));
  const fixtureSnapshot: RommzBrandAdSnapshot = {
    dataSource: "fixture",
    capturedAt: new Date().toISOString(),
    warnings: ["Local render script forced fixture mode with --use-fixture."],
    audio: {
      voiceoverSrc: args.voiceoverSrc,
      soundtrackSrc: args.soundtrackSrc,
    },
  };
  const snapshot = args.useFixture
    ? fixtureSnapshot
    : await loadDatabaseSnapshot(args);
  const payload = buildRommzBrandAdPayload(snapshot);

  await writePayloadSnapshot(PAYLOAD_PATH, payload);

  console.log(`[remotion-brand-ad] payload: ${PAYLOAD_PATH}`);
  console.log(`[remotion-brand-ad] source: ${snapshot.dataSource}`);
  if (snapshot.warnings && snapshot.warnings.length > 0) {
    for (const warning of snapshot.warnings) {
      console.warn(`[remotion-brand-ad] warning: ${warning}`);
    }
  }

  if (args.mode !== "payload") {
    runRemotionCommand(args, PAYLOAD_PATH);
  }
};

await main();
