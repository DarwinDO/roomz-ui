import {Audio} from "@remotion/media";
import type {CSSProperties} from "react";
import {AbsoluteFill, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from "remotion";

import {
  getActiveCue,
  isVoiceoverActive,
  resolveRommzBrandAdTimeline,
  type ResolvedRommzBrandAdTimeline,
} from "./rommzBrandAd.timeline";
import {
  rommzBrandAdSchema,
  type RommzBrandAdPalette,
  type RommzBrandAdProps,
  type RommzBrandAdScene,
} from "./rommzBrandAd.schema";

const DISPLAY_FONT = '"Plus Jakarta Sans", "Inter", sans-serif';
const UI_FONT = '"Manrope", "Inter", sans-serif';
const ROOT_BACKGROUND =
  "radial-gradient(circle at 12% 16%, rgba(0, 80, 212, 0.16), transparent 28%)," +
  "radial-gradient(circle at 86% 14%, rgba(255, 200, 133, 0.22), transparent 26%)," +
  "radial-gradient(circle at 84% 84%, rgba(105, 246, 184, 0.2), transparent 28%)," +
  "linear-gradient(140deg, #f8f5ff 0%, #ffffff 48%, #fff5eb 100%)";

const paletteMap = {
  primary: {
    solid: "#0050d4",
    ink: "#001e5a",
    surface: "rgba(241, 245, 255, 0.94)",
    soft: "#dce6ff",
    outline: "rgba(0, 80, 212, 0.18)",
    glow: "rgba(0, 80, 212, 0.2)",
  },
  secondary: {
    solid: "#b56f08",
    ink: "#663f00",
    surface: "rgba(255, 245, 232, 0.96)",
    soft: "#ffe1b9",
    outline: "rgba(181, 111, 8, 0.18)",
    glow: "rgba(255, 200, 133, 0.24)",
  },
  tertiary: {
    solid: "#007a53",
    ink: "#00543a",
    surface: "rgba(233, 255, 245, 0.96)",
    soft: "#a5ffd4",
    outline: "rgba(0, 122, 83, 0.18)",
    glow: "rgba(105, 246, 184, 0.24)",
  },
} satisfies Record<
  RommzBrandAdPalette,
  {
    solid: string;
    ink: string;
    surface: string;
    soft: string;
    outline: string;
    glow: string;
  }
>;

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

const getMediaSrc = (src: string) => {
  if (/^(https?:)?\/\//.test(src) || src.startsWith("data:")) {
    return src;
  }

  return staticFile(src.replace(/^\/+/, ""));
};

const getRevealText = (text: string, frame: number, charsPerFrame: number) => {
  const visibleChars = Math.floor(clamp(frame, 0, Number.MAX_SAFE_INTEGER) * charsPerFrame);

  return text.slice(0, Math.max(0, visibleChars));
};

const SceneBadge = ({
  label,
  value,
  style,
}: {
  label: string;
  value: string;
  style?: CSSProperties;
}) => {
  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        gap: 6,
        borderRadius: 28,
        padding: "16px 18px",
        background: "rgba(255, 255, 255, 0.74)",
        border: "1px solid rgba(40, 43, 81, 0.08)",
        boxShadow: "0 18px 44px rgba(40, 43, 81, 0.08)",
        backdropFilter: "blur(18px)",
        ...style,
      }}
    >
      <span
        style={{
          fontFamily: UI_FONT,
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "rgba(40, 43, 81, 0.52)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: DISPLAY_FONT,
          fontSize: 23,
          fontWeight: 700,
          lineHeight: 1.18,
          letterSpacing: "-0.03em",
          color: "#1e2452",
          maxWidth: 320,
        }}
      >
        {value}
      </span>
    </div>
  );
};

const SceneShell = ({
  brandName,
  heroImageSrc,
  locationLabel,
  logoSrc,
  scene,
  sceneIndex,
  supportLabel,
  tagline,
  totalScenes,
}: {
  brandName: string;
  heroImageSrc: string;
  locationLabel: string;
  logoSrc: string;
  scene: RommzBrandAdScene;
  sceneIndex: number;
  supportLabel: string;
  tagline: string;
  totalScenes: number;
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const palette = paletteMap[scene.palette];
  const copyEnter = spring({
    fps,
    frame,
    config: {
      damping: 16,
      mass: 0.9,
      stiffness: 140,
    },
  });
  const mediaEnter = spring({
    fps,
    frame: Math.max(0, frame - 8),
    config: {
      damping: 18,
      mass: 0.95,
      stiffness: 160,
    },
  });
  const bodyText = getRevealText(scene.body, frame - 10, 4.4);

  return (
    <AbsoluteFill
      style={{
        padding: "86px 92px 228px",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            `radial-gradient(circle at 20% 18%, ${palette.glow}, transparent 26%),` +
            `linear-gradient(180deg, rgba(255, 255, 255, 0.28) 0%, rgba(255, 255, 255, 0) 100%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 58,
          left: 62,
          fontFamily: DISPLAY_FONT,
          fontSize: 196,
          fontWeight: 800,
          letterSpacing: "-0.08em",
          color: palette.solid,
          opacity: interpolate(copyEnter, [0, 1], [0.02, 0.11]),
          transform: `translateY(${interpolate(copyEnter, [0, 1], [36, 0])}px)`,
        }}
      >
        {scene.accentWord}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.06fr 0.94fr",
          gap: 40,
          height: "100%",
          alignItems: "stretch",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            opacity: copyEnter,
            transform: `translateY(${interpolate(copyEnter, [0, 1], [48, 0])}px)`,
          }}
        >
          <div style={{display: "flex", flexDirection: "column", gap: 26}}>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
              <SceneBadge label={scene.eyebrow} value={`${sceneIndex + 1}/${totalScenes} scenes`} />
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "12px 16px",
                  borderRadius: 999,
                  background: "rgba(255, 255, 255, 0.78)",
                  border: `1px solid ${palette.outline}`,
                  boxShadow: "0 14px 34px rgba(40, 43, 81, 0.08)",
                }}
              >
                <Img
                  src={getMediaSrc(logoSrc)}
                  style={{
                    width: 34,
                    height: 34,
                    objectFit: "contain",
                  }}
                />
                <div style={{display: "flex", flexDirection: "column", gap: 2}}>
                  <span
                    style={{
                      fontFamily: DISPLAY_FONT,
                      fontSize: 18,
                      fontWeight: 700,
                      color: "#1f2448",
                      letterSpacing: "-0.03em",
                    }}
                  >
                    {brandName}
                  </span>
                  <span
                    style={{
                      fontFamily: UI_FONT,
                      fontSize: 13,
                      color: "rgba(31, 36, 72, 0.62)",
                    }}
                  >
                    {supportLabel}
                  </span>
                </div>
              </div>
            </div>
            <div style={{display: "flex", flexDirection: "column", gap: 18}}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  alignSelf: "flex-start",
                  borderRadius: 999,
                  background: palette.surface,
                  border: `1px solid ${palette.outline}`,
                  padding: "10px 16px",
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    background: palette.solid,
                    boxShadow: `0 0 0 8px ${palette.glow}`,
                  }}
                />
                <span
                  style={{
                    fontFamily: UI_FONT,
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: palette.ink,
                  }}
                >
                  {locationLabel}
                </span>
              </div>
              <h1
                style={{
                  margin: 0,
                  fontFamily: DISPLAY_FONT,
                  fontSize: 80,
                  lineHeight: 0.98,
                  letterSpacing: "-0.06em",
                  color: "#181d48",
                  maxWidth: 760,
                }}
              >
                {scene.headline}
              </h1>
              <p
                style={{
                  margin: 0,
                  fontFamily: UI_FONT,
                  fontSize: 28,
                  lineHeight: 1.55,
                  color: "rgba(31, 36, 72, 0.74)",
                  maxWidth: 720,
                  minHeight: 176,
                }}
              >
                {bodyText}
              </p>
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.04fr) minmax(320px, 0.96fr)",
              gap: 22,
              alignItems: "end",
              marginBottom: 42,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <SceneBadge label="Tagline" value={tagline} />
              <div
                style={{
                  borderRadius: 34,
                  padding: "20px 22px",
                  background: "rgba(255, 255, 255, 0.8)",
                  border: `1px solid ${palette.outline}`,
                }}
              >
                <div
                  style={{
                    fontFamily: UI_FONT,
                    fontSize: 14,
                    fontWeight: 800,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "rgba(31, 36, 72, 0.48)",
                    marginBottom: 8,
                  }}
                >
                  Visual frame
                </div>
                <div
                  style={{
                    fontFamily: DISPLAY_FONT,
                    fontSize: 28,
                    fontWeight: 700,
                    letterSpacing: "-0.03em",
                    color: "#1f2448",
                    lineHeight: 1.25,
                  }}
                >
                  {scene.visualLabel}
                </div>
              </div>
            </div>
            <SceneBadge label={scene.stat.label} value={scene.stat.value} />
          </div>
        </div>
        <div
          style={{
            position: "relative",
            opacity: mediaEnter,
            transform:
              `translateY(${interpolate(mediaEnter, [0, 1], [72, 0])}px) ` +
              `rotate(${interpolate(mediaEnter, [0, 1], [4, 0])}deg)`,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              transform: "translate(26px, 28px)",
              borderRadius: 48,
              background: palette.glow,
              filter: "blur(2px)",
            }}
          />
          <div
            style={{
              position: "relative",
              height: "100%",
              borderRadius: 48,
              overflow: "hidden",
              border: "1px solid rgba(255, 255, 255, 0.88)",
              boxShadow: "0 42px 84px rgba(40, 43, 81, 0.18)",
              background: "#ffffff",
            }}
          >
            <Img
              src={getMediaSrc(heroImageSrc)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, rgba(18, 23, 59, 0.04) 0%, rgba(18, 23, 59, 0.3) 58%, rgba(18, 23, 59, 0.66) 100%)",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 26,
                left: 26,
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 16px",
                borderRadius: 999,
                background: "rgba(9, 13, 38, 0.58)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                backdropFilter: "blur(16px)",
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: palette.solid,
                }}
              />
              <span
                style={{
                  fontFamily: UI_FONT,
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#f6f7ff",
                }}
              >
                {scene.visualLabel}
              </span>
            </div>
            <div
              style={{
                position: "absolute",
                right: 28,
                bottom: 128,
                maxWidth: 356,
                borderRadius: 34,
                background: "rgba(255, 255, 255, 0.9)",
                border: `1px solid ${palette.outline}`,
                padding: "20px 22px",
                boxShadow: "0 18px 42px rgba(40, 43, 81, 0.12)",
              }}
            >
              <div
                style={{
                  fontFamily: UI_FONT,
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "rgba(31, 36, 72, 0.5)",
                  marginBottom: 8,
                }}
              >
                Brand signal
              </div>
              <div
                style={{
                  fontFamily: DISPLAY_FONT,
                  fontSize: 30,
                  fontWeight: 700,
                  lineHeight: 1.18,
                  letterSpacing: "-0.04em",
                  color: "#1b214d",
                }}
              >
                {scene.stat.value}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const OutroScene = ({
  brandName,
  ctaDelayFrames,
  logoSrc,
  outroBody,
  outroHeadline,
  stats,
  tagline,
}: {
  brandName: string;
  ctaDelayFrames: number;
  logoSrc: string;
  outroBody: string;
  outroHeadline: string;
  stats: RommzBrandAdProps["stats"];
  tagline: string;
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const reveal = spring({
    fps,
    frame,
    config: {
      damping: 18,
      mass: 0.85,
      stiffness: 150,
    },
  });
  const ctaReveal = spring({
    fps,
    frame: Math.max(0, frame - ctaDelayFrames),
    config: {
      damping: 16,
      mass: 0.84,
      stiffness: 180,
    },
  });

  return (
    <AbsoluteFill
      style={{
        padding: "92px 96px 212px",
        justifyContent: "space-between",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 14% 20%, rgba(0, 80, 212, 0.18), transparent 24%)," +
            "radial-gradient(circle at 82% 18%, rgba(255, 200, 133, 0.22), transparent 26%)," +
            "linear-gradient(140deg, rgba(255, 255, 255, 0.92) 0%, rgba(244, 248, 255, 0.96) 100%)",
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          position: "relative",
          zIndex: 1,
          opacity: reveal,
          transform: `translateY(${interpolate(reveal, [0, 1], [42, 0])}px)`,
        }}
      >
        <div style={{display: "flex", alignItems: "center", gap: 18}}>
          <Img
            src={getMediaSrc(logoSrc)}
            style={{
              width: 74,
              height: 74,
              objectFit: "contain",
            }}
          />
          <div style={{display: "flex", flexDirection: "column", gap: 4}}>
            <span
              style={{
                fontFamily: DISPLAY_FONT,
                fontSize: 44,
                fontWeight: 800,
                letterSpacing: "-0.05em",
                color: "#121741",
              }}
            >
              {brandName}
            </span>
            <span
              style={{
                fontFamily: UI_FONT,
                fontSize: 18,
                color: "rgba(18, 23, 65, 0.62)",
              }}
            >
              {tagline}
            </span>
          </div>
        </div>
        <div
          style={{
            padding: "14px 18px",
            borderRadius: 999,
            background: "rgba(255, 255, 255, 0.78)",
            border: "1px solid rgba(0, 80, 212, 0.12)",
            fontFamily: UI_FONT,
            fontSize: 14,
            fontWeight: 800,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#0050d4",
          }}
        >
          Brand ad / payload-ready
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.12fr 0.88fr",
          gap: 40,
          alignItems: "end",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 22,
            opacity: reveal,
            transform: `translateY(${interpolate(reveal, [0, 1], [52, 0])}px)`,
          }}
        >
          <div
            style={{
              fontFamily: DISPLAY_FONT,
              fontSize: 220,
              fontWeight: 800,
              letterSpacing: "-0.1em",
              lineHeight: 0.84,
              color: "rgba(0, 80, 212, 0.08)",
            }}
          >
            ROMMZ
          </div>
          <h1
            style={{
              margin: "-66px 0 0",
              fontFamily: DISPLAY_FONT,
              fontSize: 86,
              lineHeight: 0.96,
              letterSpacing: "-0.07em",
              color: "#131943",
              maxWidth: 920,
            }}
          >
            {outroHeadline}
          </h1>
          <p
            style={{
              margin: 0,
              fontFamily: UI_FONT,
              fontSize: 28,
              lineHeight: 1.54,
              color: "rgba(19, 25, 67, 0.72)",
              maxWidth: 820,
            }}
          >
            {outroBody}
          </p>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
            alignItems: "stretch",
          }}
        >
          {stats.map((stat) => (
            <SceneBadge key={stat.label} label={stat.label} value={stat.value} />
          ))}
          <div
            style={{
              alignSelf: "flex-start",
              opacity: ctaReveal,
              transform: `translateY(${interpolate(ctaReveal, [0, 1], [24, 0])}px) scale(${interpolate(
                ctaReveal,
                [0, 1],
                [0.94, 1],
              )})`,
              borderRadius: 999,
              padding: "18px 24px",
              background: "linear-gradient(135deg, #0c62f5 0%, #0050d4 46%, #003fae 100%)",
              color: "#f5f7ff",
              boxShadow: "0 20px 42px rgba(0, 80, 212, 0.24)",
            }}
          >
            <div
              style={{
                fontFamily: UI_FONT,
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                opacity: 0.78,
                marginBottom: 6,
              }}
            >
              Next phase
            </div>
            <div
              style={{
                fontFamily: DISPLAY_FONT,
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: "-0.03em",
              }}
            >
              Setup data normalization + render local preview
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const TimelineRail = ({
  currentFrame,
  timeline,
}: {
  currentFrame: number;
  timeline: ResolvedRommzBrandAdTimeline;
}) => {
  const segments = [
    ...timeline.scenes.map((scene) => ({
      id: scene.scene.id,
      label: scene.scene.accentWord,
      palette: scene.scene.palette,
      startFrame: scene.startFrame,
      endFrame: scene.endFrame,
    })),
    {
      id: "outro",
      label: "OUTRO",
      palette: "primary" as const,
      startFrame: timeline.outro.startFrame,
      endFrame: timeline.outro.endFrame,
    },
  ];

  return (
    <div
      style={{
        position: "absolute",
        left: 92,
        right: 92,
        bottom: 34,
        display: "grid",
        gridTemplateColumns: `repeat(${segments.length}, minmax(0, 1fr))`,
        gap: 12,
        zIndex: 30,
      }}
    >
      {segments.map((segment) => {
        const palette = paletteMap[segment.palette];
        const segmentLength = segment.endFrame - segment.startFrame;
        const fill = clamp((currentFrame - segment.startFrame) / Math.max(1, segmentLength), 0, 1);

        return (
          <div
            key={segment.id}
            style={{
              borderRadius: 24,
              background: "rgba(255, 255, 255, 0.78)",
              border: `1px solid ${palette.outline}`,
              padding: "12px 14px",
              boxShadow: "0 16px 30px rgba(40, 43, 81, 0.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  fontFamily: DISPLAY_FONT,
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#1e2452",
                  letterSpacing: "-0.02em",
                }}
              >
                {segment.label}
              </span>
              <span
                style={{
                  fontFamily: UI_FONT,
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(30, 36, 82, 0.46)",
                }}
              >
                {segment.startFrame}f
              </span>
            </div>
            <div
              style={{
                height: 8,
                borderRadius: 999,
                background: palette.soft,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${fill * 100}%`,
                  height: "100%",
                  borderRadius: 999,
                  background: palette.solid,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const CaptionStrip = ({
  currentFrame,
  timeline,
}: {
  currentFrame: number;
  timeline: ResolvedRommzBrandAdTimeline;
}) => {
  const activeCue = getActiveCue(currentFrame, timeline);
  const palette = activeCue ? paletteMap[activeCue.palette] : paletteMap.primary;
  const captionText = activeCue
    ? getRevealText(activeCue.text, currentFrame - activeCue.startFrame, 2.8)
    : "Voiceover timeline scaffold is ready. Attach a track or keep captions-only while iterating locally.";

  return (
    <div
      style={{
        position: "absolute",
        left: 92,
        right: 92,
        bottom: 118,
        display: "flex",
        justifyContent: "space-between",
        gap: 18,
        alignItems: "center",
        borderRadius: 36,
        padding: "20px 24px",
        background: "rgba(11, 15, 40, 0.78)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        boxShadow: "0 30px 70px rgba(9, 12, 34, 0.18)",
        zIndex: 30,
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 12,
          minWidth: 220,
        }}
      >
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: 999,
            background: palette.solid,
            boxShadow: `0 0 0 8px ${palette.glow}`,
          }}
        />
        <div style={{display: "flex", flexDirection: "column", gap: 2}}>
          <span
            style={{
              fontFamily: UI_FONT,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "rgba(241, 244, 255, 0.58)",
            }}
          >
            Voiceover cue
          </span>
          <span
            style={{
              fontFamily: DISPLAY_FONT,
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "#f5f7ff",
            }}
          >
            {activeCue ? activeCue.id.replace(/-cue$/, "") : "preview"}
          </span>
        </div>
      </div>
      <div
        style={{
          flex: 1,
          fontFamily: UI_FONT,
          fontSize: 21,
          lineHeight: 1.45,
          color: "#f5f7ff",
        }}
      >
        {captionText}
      </div>
    </div>
  );
};

const AudioLayer = ({
  props,
  timeline,
}: {
  props: RommzBrandAdProps;
  timeline: ResolvedRommzBrandAdTimeline;
}) => {
  const soundtrack = props.audio.soundtrack;
  const voiceover = props.audio.voiceover;

  return (
    <>
      {soundtrack ? (
        <Audio
          src={getMediaSrc(soundtrack.src)}
          trimBefore={soundtrack.trimBeforeInFrames}
          loop={soundtrack.loop}
          volume={(frame) => {
            return isVoiceoverActive(frame, timeline) ? soundtrack.duckedVolume : soundtrack.volume;
          }}
        />
      ) : null}
      {voiceover.src ? (
        <Sequence from={timeline.introEndFrame}>
          <Audio
            src={getMediaSrc(voiceover.src)}
            volume={(frame) => {
              if (voiceover.fadeInFrames <= 0) {
                return voiceover.volume;
              }

              return voiceover.volume * clamp(frame / voiceover.fadeInFrames, 0, 1);
            }}
          />
        </Sequence>
      ) : null}
    </>
  );
};

export const RommzBrandAd = (props: RommzBrandAdProps) => {
  const parsedProps = rommzBrandAdSchema.parse(props);
  const timeline = resolveRommzBrandAdTimeline(parsedProps);
  const currentFrame = useCurrentFrame();
  const {height, width} = useVideoConfig();
  const orbSize = Math.min(width, height) * 0.34;

  return (
    <AbsoluteFill
      style={{
        background: ROOT_BACKGROUND,
        color: "#14193f",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -orbSize * 0.24,
          left: -orbSize * 0.08,
          width: orbSize,
          height: orbSize,
          borderRadius: orbSize,
          background: "rgba(0, 80, 212, 0.1)",
          filter: "blur(44px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -orbSize * 0.18,
          right: -orbSize * 0.04,
          width: orbSize * 0.92,
          height: orbSize * 0.92,
          borderRadius: orbSize,
          background: "rgba(255, 200, 133, 0.14)",
          filter: "blur(36px)",
        }}
      />
      {timeline.scenes.map((resolvedScene) => {
        return (
          <Sequence
            key={resolvedScene.scene.id}
            from={resolvedScene.startFrame}
            durationInFrames={resolvedScene.durationInFrames}
          >
            <SceneShell
              brandName={parsedProps.brandName}
              heroImageSrc={parsedProps.heroImageSrc}
              locationLabel={parsedProps.locationLabel}
              logoSrc={parsedProps.logoSrc}
              scene={resolvedScene.scene}
              sceneIndex={resolvedScene.index}
              supportLabel={parsedProps.supportLabel}
              tagline={parsedProps.tagline}
              totalScenes={timeline.scenes.length}
            />
          </Sequence>
        );
      })}
      <Sequence from={timeline.outro.startFrame} durationInFrames={timeline.outro.durationInFrames}>
        <OutroScene
          brandName={parsedProps.brandName}
          ctaDelayFrames={timeline.outro.ctaStartFrame - timeline.outro.startFrame}
          logoSrc={parsedProps.logoSrc}
          outroBody={parsedProps.outro.body}
          outroHeadline={parsedProps.outro.headline}
          stats={parsedProps.stats}
          tagline={parsedProps.tagline}
        />
      </Sequence>
      <CaptionStrip currentFrame={currentFrame} timeline={timeline} />
      <TimelineRail currentFrame={currentFrame} timeline={timeline} />
      <AudioLayer props={parsedProps} timeline={timeline} />
    </AbsoluteFill>
  );
};
