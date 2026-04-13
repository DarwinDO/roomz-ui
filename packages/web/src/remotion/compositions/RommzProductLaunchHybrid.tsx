import {Audio} from "@remotion/media";
import type {ReactNode} from "react";
import {AbsoluteFill, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from "remotion";

import {
  getActiveRommzProductLaunchHybridCue,
  isRommzProductLaunchHybridVoiceoverActive,
  resolveRommzProductLaunchHybridTimeline,
  type ResolvedRommzProductLaunchHybridScene,
  type ResolvedRommzProductLaunchHybridTimeline,
} from "./rommzProductLaunchHybrid.timeline";
import {
  rommzProductLaunchHybridSchema,
  type RommzProductLaunchHybridPalette,
  type RommzProductLaunchHybridProps,
  type RommzProductLaunchHybridScene,
} from "./rommzProductLaunchHybrid.schema";

const DISPLAY_FONT = '"Plus Jakarta Sans", "Inter", sans-serif';
const UI_FONT = '"Manrope", "Inter", sans-serif';
const ROOT_BACKGROUND =
  "radial-gradient(circle at 12% 18%, rgba(14, 96, 228, 0.16), transparent 26%)," +
  "radial-gradient(circle at 84% 16%, rgba(218, 131, 27, 0.16), transparent 24%)," +
  "radial-gradient(circle at 84% 84%, rgba(12, 122, 92, 0.12), transparent 26%)," +
  "linear-gradient(145deg, #fbfdff 0%, #f8fbff 48%, #fff4ea 100%)";

const paletteMap = {
  ink: {
    solid: "#0f172a",
    ink: "#0f172a",
    soft: "#e2e8f0",
    surface: "rgba(255,255,255,0.84)",
    glow: "rgba(15, 23, 42, 0.1)",
  },
  blue: {
    solid: "#0f62fe",
    ink: "#0b3b8a",
    soft: "#dbeafe",
    surface: "rgba(239, 246, 255, 0.9)",
    glow: "rgba(15, 98, 254, 0.14)",
  },
  sand: {
    solid: "#b45309",
    ink: "#8c3c07",
    soft: "#ffedd5",
    surface: "rgba(255, 247, 237, 0.94)",
    glow: "rgba(180, 83, 9, 0.16)",
  },
  green: {
    solid: "#0f766e",
    ink: "#115e59",
    soft: "#ccfbf1",
    surface: "rgba(240, 253, 250, 0.92)",
    glow: "rgba(15, 118, 110, 0.16)",
  },
} satisfies Record<
  RommzProductLaunchHybridPalette,
  {
    solid: string;
    ink: string;
    soft: string;
    surface: string;
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
  const visibleChars = Math.floor(Math.max(frame, 0) * charsPerFrame);

  return text.slice(0, Math.max(0, visibleChars));
};

const SectionChip = ({
  accent,
  label,
}: {
  accent: string;
  label: string;
}) => {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        borderRadius: 999,
        padding: "10px 16px",
        background: "rgba(255,255,255,0.82)",
        border: "1px solid rgba(148, 163, 184, 0.18)",
        boxShadow: "0 12px 26px rgba(15, 23, 42, 0.08)",
      }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: 999,
          background: accent,
          boxShadow: `0 0 0 8px ${accent}22`,
        }}
      />
      <span
        style={{
          fontFamily: UI_FONT,
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "#334155",
        }}
      >
        {label}
      </span>
    </div>
  );
};

const StatCard = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => {
  return (
    <div
      style={{
        borderRadius: 28,
        padding: "16px 18px",
        background: "rgba(255,255,255,0.84)",
        border: "1px solid rgba(148, 163, 184, 0.18)",
        boxShadow: "0 14px 32px rgba(15, 23, 42, 0.08)",
      }}
    >
      <div
        style={{
          fontFamily: UI_FONT,
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "rgba(51, 65, 85, 0.56)",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: DISPLAY_FONT,
          fontSize: 26,
          lineHeight: 1.18,
          letterSpacing: "-0.04em",
          color: "#0f172a",
          maxWidth: 360,
        }}
      >
        {value}
      </div>
    </div>
  );
};

const BrowserFrame = ({
  children,
  eyebrow,
  surfaceLabel,
}: {
  children: ReactNode;
  eyebrow: string;
  surfaceLabel: string;
}) => {
  return (
    <div
      style={{
        position: "relative",
        borderRadius: 38,
        overflow: "hidden",
        background: "rgba(255,255,255,0.9)",
        border: "1px solid rgba(255,255,255,0.9)",
        boxShadow: "0 30px 70px rgba(15, 23, 42, 0.14)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "18px 22px",
          borderBottom: "1px solid rgba(226, 232, 240, 0.9)",
          background: "linear-gradient(180deg, rgba(248,250,252,0.98) 0%, rgba(255,255,255,0.92) 100%)",
        }}
      >
        <div style={{display: "flex", alignItems: "center", gap: 8}}>
          {["#fb7185", "#f59e0b", "#22c55e"].map((color) => (
            <span
              key={color}
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: color,
              }}
            />
          ))}
        </div>
        <div
          style={{
            fontFamily: UI_FONT,
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#64748b",
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            padding: "8px 12px",
            borderRadius: 999,
            background: "rgba(241,245,249,0.88)",
            fontFamily: UI_FONT,
            fontSize: 12,
            color: "#475569",
          }}
        >
          {surfaceLabel}
        </div>
      </div>
      <div
        style={{
          position: "relative",
          minHeight: 650,
          background: "linear-gradient(180deg, rgba(248,251,255,0.4) 0%, rgba(255,255,255,0.2) 100%)",
        }}
      >
        {children}
      </div>
    </div>
  );
};

const CaptureFill = ({
  opacity = 1,
  src,
}: {
  opacity?: number;
  src: string;
}) => {
  return (
    <Img
      src={getMediaSrc(src)}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        opacity,
      }}
    />
  );
};

const CopyColumn = ({
  body,
  headline,
  scene,
}: {
  body: string;
  headline: string;
  scene: RommzProductLaunchHybridScene;
}) => {
  const palette = paletteMap[scene.palette];

  return (
    <div style={{display: "flex", flexDirection: "column", gap: 22}}>
      <SectionChip accent={palette.solid} label={scene.eyebrow} />
      <h1
        style={{
          margin: 0,
          fontFamily: DISPLAY_FONT,
          fontSize: 74,
          lineHeight: 0.98,
          letterSpacing: "-0.06em",
          color: "#0f172a",
          maxWidth: 720,
        }}
      >
        {headline}
      </h1>
      <p
        style={{
          margin: 0,
          fontFamily: UI_FONT,
          fontSize: 25,
          lineHeight: 1.55,
          color: "rgba(15, 23, 42, 0.72)",
          maxWidth: 680,
        }}
      >
        {body}
      </p>
      <div style={{display: "flex", gap: 16, flexWrap: "wrap"}}>
        <StatCard label={scene.statLabel} value={scene.statValue} />
        <StatCard label="Điểm chính" value={scene.chipLabel} />
      </div>
    </div>
  );
};

const HookScene = ({scene}: {scene: RommzProductLaunchHybridScene}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({
    fps,
    frame,
    config: {damping: 16, mass: 0.88, stiffness: 150},
  });

  return (
    <AbsoluteFill style={{padding: "90px 96px 216px"}}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "0.98fr 1.02fr",
          gap: 38,
          height: "100%",
          alignItems: "center",
        }}
      >
        <div
          style={{
            opacity: enter,
            transform: `translateY(${interpolate(enter, [0, 1], [42, 0])}px)`,
          }}
        >
          <CopyColumn
            scene={scene}
            headline={scene.headline}
            body={getRevealText(scene.body, frame - 6, 3.7)}
          />
        </div>
        <div
          style={{
            position: "relative",
            height: "100%",
            minHeight: 640,
            opacity: enter,
          }}
        >
          {[
            {top: 40, left: 24, rotate: -7, width: 360, label: "Tin đăng thiếu giá", color: "#fb7185"},
            {top: 186, right: 18, rotate: 6, width: 334, label: "Vị trí mơ hồ", color: "#f59e0b"},
            {bottom: 164, left: 82, rotate: -5, width: 388, label: "Ảnh không đủ tin", color: "#94a3b8"},
          ].map((card, index) => {
            const localEnter = spring({
              fps,
              frame: Math.max(0, frame - index * 6),
              config: {damping: 15, mass: 0.9, stiffness: 140},
            });

            return (
              <div
                key={card.label}
                style={{
                  position: "absolute",
                  top: card.top,
                  right: card.right,
                  bottom: card.bottom,
                  left: card.left,
                  width: card.width,
                  borderRadius: 32,
                  padding: "22px 24px",
                  background: "rgba(255,255,255,0.84)",
                  border: "1px solid rgba(148,163,184,0.24)",
                  boxShadow: "0 24px 56px rgba(15,23,42,0.12)",
                  transform:
                    `translateY(${interpolate(localEnter, [0, 1], [52, 0])}px) ` +
                    `rotate(${card.rotate}deg)`,
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 14px",
                    borderRadius: 999,
                    background: `${card.color}15`,
                    color: card.color,
                    fontFamily: UI_FONT,
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 999,
                      background: card.color,
                    }}
                  />
                  {card.label}
                </div>
                <div
                  style={{
                    marginTop: 24,
                    display: "grid",
                    gap: 16,
                  }}
                >
                  <div style={{height: 24, borderRadius: 12, background: "#e2e8f0"}} />
                  <div style={{height: 18, width: "82%", borderRadius: 9, background: "#eef2f7"}} />
                  <div style={{height: 18, width: "68%", borderRadius: 9, background: "#eef2f7"}} />
                  <div
                    style={{
                      marginTop: 12,
                      display: "grid",
                      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                      gap: 12,
                    }}
                  >
                    <div style={{height: 138, borderRadius: 24, background: "#f8fafc"}} />
                    <div style={{height: 138, borderRadius: 24, background: "#f8fafc"}} />
                  </div>
                </div>
              </div>
            );
          })}
          <div
            style={{
              position: "absolute",
              right: 36,
              bottom: 48,
              borderRadius: 999,
              padding: "16px 22px",
              background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
              color: "#f8fafc",
              boxShadow: "0 18px 42px rgba(15,23,42,0.18)",
            }}
          >
            <div
              style={{
                fontFamily: UI_FONT,
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                opacity: 0.68,
                marginBottom: 6,
              }}
            >
              Hook
            </div>
            <div
              style={{
                fontFamily: DISPLAY_FONT,
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: "-0.04em",
              }}
            >
              Find a room, not a headache.
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const RevealScene = ({
  captures,
  scene,
}: {
  captures: RommzProductLaunchHybridProps["captures"];
  scene: RommzProductLaunchHybridScene;
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({
    fps,
    frame,
    config: {damping: 18, mass: 0.9, stiffness: 150},
  });

  return (
    <AbsoluteFill style={{padding: "90px 96px 208px"}}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "0.88fr 1.12fr",
          gap: 34,
          height: "100%",
          alignItems: "center",
        }}
      >
        <div
          style={{
            opacity: enter,
            transform: `translateY(${interpolate(enter, [0, 1], [40, 0])}px)`,
          }}
        >
          <CopyColumn
            scene={scene}
            headline={scene.headline}
            body={getRevealText(scene.body, frame - 10, 3.6)}
          />
        </div>
        <div
          style={{
            opacity: enter,
            transform:
              `translateY(${interpolate(enter, [0, 1], [54, 0])}px) ` +
              `rotate(${interpolate(enter, [0, 1], [2.4, 0])}deg)`,
          }}
        >
          <BrowserFrame eyebrow="RommZ" surfaceLabel="Landing / public">
            <div style={{position: "absolute", inset: 0}}>
              <CaptureFill src={captures["landing-hero"]} />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(15,23,42,0.26) 100%)",
                }}
              />
            </div>
            <div
              style={{
                position: "absolute",
                left: 28,
                right: 28,
                top: 26,
                display: "grid",
                gridTemplateColumns: "1.1fr 0.9fr",
                gap: 18,
              }}
            >
              <div
                style={{
                  borderRadius: 26,
                  padding: "16px 18px",
                  background: "rgba(255,255,255,0.84)",
                  border: "1px solid rgba(255,255,255,0.7)",
                  boxShadow: "0 18px 36px rgba(15,23,42,0.1)",
                }}
              >
                <div
                  style={{
                    fontFamily: DISPLAY_FONT,
                    fontSize: 26,
                    fontWeight: 700,
                    letterSpacing: "-0.04em",
                    color: "#0f172a",
                  }}
                >
                  Tìm phòng đúng khu vực ngay từ điểm vào.
                </div>
              </div>
              <div
                style={{
                  borderRadius: 26,
                  padding: "16px 18px",
                  background: "rgba(15,23,42,0.82)",
                  color: "#f8fafc",
                  alignSelf: "flex-start",
                }}
              >
                <div
                  style={{
                    fontFamily: UI_FONT,
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    opacity: 0.64,
                    marginBottom: 8,
                  }}
                >
                  Bắt đầu
                </div>
                <div style={{fontFamily: DISPLAY_FONT, fontSize: 24, letterSpacing: "-0.04em"}}>
                  Bắt đầu tìm, hỏi ROMI và đi tiếp gọn hơn trong cùng một nơi.
                </div>
              </div>
            </div>
          </BrowserFrame>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const SearchScene = ({
  captures,
  scene,
}: {
  captures: RommzProductLaunchHybridProps["captures"];
  scene: RommzProductLaunchHybridScene;
}) => {
  const frame = useCurrentFrame();
  const palette = paletteMap[scene.palette];

  return (
    <AbsoluteFill style={{padding: "88px 92px 206px"}}>
      <div style={{display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: 34, height: "100%", alignItems: "center"}}>
        <CopyColumn scene={scene} headline={scene.headline} body={getRevealText(scene.body, frame - 8, 3.8)} />
        <BrowserFrame eyebrow="Search" surfaceLabel="Bộ lọc / map / shortlist">
          <div style={{position: "absolute", inset: 0}}>
            <CaptureFill src={captures["search-results"]} opacity={0.92} />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.04) 42%, rgba(15,23,42,0.14) 100%)",
              }}
            />
          </div>
          <div style={{position: "absolute", left: 26, right: 26, top: 26, display: "grid", gap: 16}}>
            <div
              style={{
                borderRadius: 26,
                padding: "16px 18px",
                background: "rgba(255,255,255,0.88)",
                border: "1px solid rgba(255,255,255,0.78)",
                display: "grid",
                gridTemplateColumns: "1.2fr 0.8fr",
                gap: 16,
                boxShadow: "0 18px 36px rgba(15,23,42,0.1)",
              }}
            >
              <div
                style={{
                  borderRadius: 18,
                  padding: "14px 16px",
                  background: "#f8fbff",
                  border: `1px solid ${palette.soft}`,
                  fontFamily: UI_FONT,
                  fontSize: 18,
                  color: "#0f172a",
                }}
              >
                Thành phố Thủ Đức • dưới 5 triệu
              </div>
              <div
                style={{
                  borderRadius: 18,
                  padding: "14px 16px",
                  background: "linear-gradient(135deg, #0f62fe 0%, #1d4ed8 100%)",
                  color: "#eff6ff",
                  fontFamily: DISPLAY_FONT,
                  fontSize: 20,
                  letterSpacing: "-0.03em",
                }}
              >
                Tìm nhanh
              </div>
            </div>
            <div style={{display: "flex", gap: 12, flexWrap: "wrap"}}>
              {["Đã xác thực", "Dưới 5 triệu", "Có nội thất", "Gần metro"].map((chip, index) => (
                <div
                  key={chip}
                  style={{
                    padding: "12px 16px",
                    borderRadius: 999,
                    background: index === 0 ? `${palette.solid}16` : "rgba(255,255,255,0.84)",
                    color: index === 0 ? palette.ink : "#334155",
                    border: "1px solid rgba(148,163,184,0.18)",
                    fontFamily: UI_FONT,
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  {chip}
                </div>
              ))}
            </div>
            <div
              style={{
                width: 340,
                borderRadius: 28,
                padding: "18px 20px",
                background: "rgba(15,23,42,0.82)",
                color: "#f8fafc",
                marginTop: 6,
              }}
            >
              <div
                style={{
                  fontFamily: UI_FONT,
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  opacity: 0.66,
                  marginBottom: 8,
                }}
              >
                Search flow
              </div>
              <div style={{fontFamily: DISPLAY_FONT, fontSize: 22, letterSpacing: "-0.04em", lineHeight: 1.16}}>
                Vị trí, giá, diện tích và tiện ích cùng nằm trong một nhịp lọc.
              </div>
            </div>
          </div>
        </BrowserFrame>
      </div>
    </AbsoluteFill>
  );
};

const ListingsScene = ({
  captures,
  scene,
}: {
  captures: RommzProductLaunchHybridProps["captures"];
  scene: RommzProductLaunchHybridScene;
}) => {
  const frame = useCurrentFrame();
  const palette = paletteMap[scene.palette];

  return (
    <AbsoluteFill style={{padding: "88px 92px 206px"}}>
      <div style={{display: "grid", gridTemplateColumns: "0.92fr 1.08fr", gap: 34, height: "100%", alignItems: "center"}}>
        <CopyColumn scene={scene} headline={scene.headline} body={getRevealText(scene.body, frame - 8, 3.7)} />
        <BrowserFrame eyebrow="Browse" surfaceLabel="Listings + map">
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              gridTemplateColumns: "0.92fr 1.08fr",
            }}
          >
            <div
              style={{
                padding: "24px 20px",
                background: "rgba(255,255,255,0.76)",
                display: "grid",
                gap: 16,
              }}
            >
              {[
                {title: "Studio gần tuyến metro", price: "4.9 triệu", selected: true},
                {title: "Phòng riêng có nội thất", price: "4.6 triệu", selected: false},
                {title: "Căn mini verified", price: "5.0 triệu", selected: false},
              ].map((card) => (
                <div
                  key={card.title}
                  style={{
                    borderRadius: 26,
                    padding: "18px 18px",
                    background: card.selected ? `${palette.solid}14` : "rgba(248,250,252,0.94)",
                    border: card.selected
                      ? `1px solid ${palette.solid}44`
                      : "1px solid rgba(226,232,240,0.9)",
                    boxShadow: card.selected ? "0 16px 32px rgba(180, 83, 9, 0.12)" : "none",
                  }}
                >
                  <div style={{display: "flex", justifyContent: "space-between", gap: 14}}>
                    <div>
                      <div
                        style={{
                          fontFamily: DISPLAY_FONT,
                          fontSize: 22,
                          letterSpacing: "-0.03em",
                          color: "#0f172a",
                        }}
                      >
                        {card.title}
                      </div>
                      <div
                        style={{
                          fontFamily: UI_FONT,
                          fontSize: 14,
                          color: "#475569",
                          marginTop: 6,
                        }}
                      >
                        Verified • 26m² • Thủ Đức
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "10px 14px",
                        borderRadius: 999,
                        background: card.selected ? "#fff7ed" : "#ffffff",
                        fontFamily: DISPLAY_FONT,
                        fontSize: 18,
                        color: palette.ink,
                        alignSelf: "flex-start",
                      }}
                    >
                      {card.price}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{position: "relative"}}>
              <CaptureFill src={captures["search-results"]} />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(15,23,42,0.16) 100%)",
                }}
              />
              {[{top: 104, left: 172}, {top: 252, left: 308}, {top: 386, left: 222}].map((pin, index) => (
                <div
                  key={`${pin.left}-${pin.top}`}
                  style={{
                    position: "absolute",
                    top: pin.top,
                    left: pin.left,
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    background: index === 0 ? palette.solid : "#ffffff",
                    boxShadow: `0 0 0 10px ${index === 0 ? palette.glow : "rgba(255,255,255,0.26)"}`,
                    border: index === 0 ? "none" : "2px solid rgba(15,23,42,0.18)",
                  }}
                />
              ))}
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              right: 28,
              bottom: 24,
              width: 360,
              borderRadius: 28,
              padding: "18px 20px",
              background: "rgba(255,255,255,0.9)",
              border: "1px solid rgba(255,255,255,0.74)",
              boxShadow: "0 18px 36px rgba(15,23,42,0.12)",
            }}
          >
            <div
              style={{
                fontFamily: UI_FONT,
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(51,65,85,0.56)",
                marginBottom: 8,
              }}
            >
              Room detail
            </div>
            <div style={{fontFamily: DISPLAY_FONT, fontSize: 24, letterSpacing: "-0.04em", color: "#0f172a"}}>
              Giá, ảnh, verified badge và CTA đều đọc được trước khi liên hệ.
            </div>
          </div>
        </BrowserFrame>
      </div>
    </AbsoluteFill>
  );
};

const RomiScene = ({
  captures,
  scene,
}: {
  captures: RommzProductLaunchHybridProps["captures"];
  scene: RommzProductLaunchHybridScene;
}) => {
  const frame = useCurrentFrame();
  const palette = paletteMap[scene.palette];

  return (
    <AbsoluteFill style={{padding: "88px 92px 206px"}}>
      <div style={{display: "grid", gridTemplateColumns: "0.86fr 1.14fr", gap: 34, height: "100%", alignItems: "center"}}>
        <CopyColumn scene={scene} headline={scene.headline} body={getRevealText(scene.body, frame - 8, 3.8)} />
        <BrowserFrame eyebrow="ROMI" surfaceLabel="Gợi ý theo nhu cầu">
          <div style={{position: "absolute", inset: 0}}>
            <CaptureFill src={captures["romi-chat"]} />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(15,23,42,0.08) 100%)",
              }}
            />
          </div>
          <div style={{position: "absolute", left: 26, top: 26, display: "grid", gap: 14}}>
            <div
              style={{
                maxWidth: 320,
                borderRadius: 26,
                padding: "18px 20px",
                background: "rgba(15,23,42,0.84)",
                color: "#f8fafc",
              }}
            >
              <div
                style={{
                  fontFamily: UI_FONT,
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  opacity: 0.68,
                  marginBottom: 8,
                }}
              >
                Gợi ý Romi
              </div>
              <div style={{fontFamily: DISPLAY_FONT, fontSize: 22, letterSpacing: "-0.04em", lineHeight: 1.18}}>
                Hỏi đúng trước khi gợi ý, giữ flow chat-first thay vì mở thêm nhiều panel.
              </div>
            </div>
            <div style={{display: "flex", gap: 12, flexWrap: "wrap"}}>
              {["Thủ Đức", "Dưới 5 triệu", "Gần metro"].map((chip) => (
                <div
                  key={chip}
                  style={{
                    padding: "11px 15px",
                    borderRadius: 999,
                    background: `${palette.solid}14`,
                    color: palette.ink,
                    fontFamily: UI_FONT,
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  {chip}
                </div>
              ))}
            </div>
          </div>
        </BrowserFrame>
      </div>
    </AbsoluteFill>
  );
};

const ServicesScene = ({
  captures,
  scene,
}: {
  captures: RommzProductLaunchHybridProps["captures"];
  scene: RommzProductLaunchHybridScene;
}) => {
  const frame = useCurrentFrame();
  const palette = paletteMap[scene.palette];

  return (
    <AbsoluteFill style={{padding: "88px 92px 206px"}}>
      <div style={{display: "grid", gridTemplateColumns: "0.84fr 1.16fr", gap: 34, height: "100%", alignItems: "center"}}>
        <CopyColumn scene={scene} headline={scene.headline} body={getRevealText(scene.body, frame - 8, 3.8)} />
        <div style={{display: "grid", gap: 22}}>
          <BrowserFrame eyebrow="Services" surfaceLabel="Ưu đãi quanh nơi ở">
            <div style={{position: "absolute", inset: 0}}>
              <CaptureFill src={captures["services-deals"]} />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 100%)",
                }}
              />
            </div>
            <div
              style={{
                position: "absolute",
                left: 24,
                bottom: 22,
                borderRadius: 26,
                padding: "16px 18px",
                background: "rgba(255,255,255,0.9)",
                boxShadow: "0 18px 36px rgba(15,23,42,0.1)",
              }}
            >
              <div
                style={{
                  fontFamily: UI_FONT,
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(51,65,85,0.56)",
                  marginBottom: 8,
                }}
              >
                Deals
              </div>
              <div style={{fontFamily: DISPLAY_FONT, fontSize: 22, letterSpacing: "-0.04em", color: "#0f172a"}}>
                Voucher địa phương nằm ngay sau flow tìm phòng.
              </div>
            </div>
          </BrowserFrame>
          <BrowserFrame eyebrow="RommZ+" surfaceLabel="Pricing / premium">
            <div style={{position: "absolute", inset: 0}}>
              <CaptureFill src={captures["payment-pricing"]} />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 100%)",
                }}
              />
            </div>
            <div
              style={{
                position: "absolute",
                right: 24,
                top: 24,
                borderRadius: 24,
                padding: "14px 16px",
                background: `${palette.solid}16`,
                color: palette.ink,
                fontFamily: DISPLAY_FONT,
                fontSize: 24,
                letterSpacing: "-0.04em",
              }}
            >
              39.000đ / tháng
            </div>
          </BrowserFrame>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const CtaScene = ({
  brandName,
  logoSrc,
  scene,
  supportLabel,
  tagline,
  timing,
}: {
  brandName: string;
  logoSrc: string;
  scene: RommzProductLaunchHybridScene;
  supportLabel: string;
  tagline: string;
  timing: RommzProductLaunchHybridProps["timing"];
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const reveal = spring({
    fps,
    frame,
    config: {damping: 18, mass: 0.84, stiffness: 150},
  });
  const glow = spring({
    fps,
    frame: Math.max(0, frame - timing.ctaGlowDelayFrames),
    config: {damping: 16, mass: 0.88, stiffness: 160},
  });

  return (
    <AbsoluteFill style={{padding: "96px 96px 220px"}}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 18% 18%, rgba(15, 98, 254, 0.18), transparent 26%)," +
            "radial-gradient(circle at 84% 18%, rgba(180, 83, 9, 0.14), transparent 24%)," +
            "linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(247,250,255,0.98) 100%)",
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          opacity: reveal,
          transform: `translateY(${interpolate(reveal, [0, 1], [42, 0])}px)`,
        }}
      >
        <div style={{display: "flex", alignItems: "center", gap: 18}}>
          <Img
            src={getMediaSrc(logoSrc)}
            style={{
              width: 76,
              height: 76,
              objectFit: "contain",
            }}
          />
          <div>
            <div
              style={{
                fontFamily: DISPLAY_FONT,
                fontSize: 46,
                fontWeight: 800,
                letterSpacing: "-0.05em",
                color: "#0f172a",
              }}
            >
              {brandName}
            </div>
            <div
              style={{
                fontFamily: UI_FONT,
                fontSize: 18,
                color: "rgba(15,23,42,0.64)",
              }}
            >
              {supportLabel}
            </div>
          </div>
        </div>
        <SectionChip accent="#0f62fe" label="Hybrid product launch" />
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.06fr 0.94fr",
          gap: 38,
          alignItems: "end",
          height: "100%",
        }}
      >
        <div
          style={{
            alignSelf: "center",
            opacity: reveal,
          }}
        >
          <div
            style={{
              fontFamily: DISPLAY_FONT,
              fontSize: 220,
              fontWeight: 800,
              letterSpacing: "-0.1em",
              lineHeight: 0.84,
              color: "rgba(15, 98, 254, 0.08)",
            }}
          >
            ROMMZ
          </div>
          <h1
            style={{
              margin: "-62px 0 0",
              fontFamily: DISPLAY_FONT,
              fontSize: 86,
              lineHeight: 0.96,
              letterSpacing: "-0.07em",
              color: "#0f172a",
              maxWidth: 900,
            }}
          >
            {scene.headline}
          </h1>
          <p
            style={{
              margin: "20px 0 0",
              fontFamily: UI_FONT,
              fontSize: 28,
              lineHeight: 1.56,
              color: "rgba(15,23,42,0.72)",
              maxWidth: 820,
            }}
          >
            {scene.body}
          </p>
        </div>
        <div style={{display: "grid", gap: 18}}>
          {[
            "Bắt đầu từ đúng khu vực bạn muốn ở",
            "Xem ảnh, map và chi tiết trong cùng một nhịp",
            "Có ROMI khi cần gom shortlist",
            "Có thêm ưu đãi và RommZ+ cho bước tiếp theo",
          ].map((item) => (
            <StatCard key={item} label="Bạn có" value={item} />
          ))}
          <div
            style={{
              borderRadius: 999,
              padding: "18px 24px",
              background: "linear-gradient(135deg, #0f62fe 0%, #1d4ed8 100%)",
              color: "#eff6ff",
              boxShadow: "0 20px 46px rgba(15, 98, 254, 0.24)",
              opacity: glow,
              transform: `translateY(${interpolate(glow, [0, 1], [24, 0])}px) scale(${interpolate(glow, [0, 1], [0.94, 1])})`,
            }}
          >
            <div
              style={{
                fontFamily: UI_FONT,
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                opacity: 0.72,
                marginBottom: 6,
              }}
            >
              CTA
            </div>
            <div style={{fontFamily: DISPLAY_FONT, fontSize: 30, letterSpacing: "-0.04em"}}>
              {tagline}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const CaptionStrip = ({
  currentFrame,
  timeline,
}: {
  currentFrame: number;
  timeline: ResolvedRommzProductLaunchHybridTimeline;
}) => {
  const activeCue = getActiveRommzProductLaunchHybridCue(currentFrame, timeline);
  const palette = activeCue ? paletteMap[activeCue.palette] : paletteMap.blue;
  const captionText = activeCue
    ? getRevealText(activeCue.text, currentFrame - activeCue.startFrame, 2.6)
    : "Hybrid Remotion ad scaffold is ready. Attach real voiceover or keep captions-only while iterating locally.";

  return (
    <div
      style={{
        position: "absolute",
        left: 92,
        right: 92,
        bottom: 122,
        display: "flex",
        alignItems: "center",
        gap: 18,
        borderRadius: 34,
        padding: "20px 24px",
        background: "rgba(10, 14, 34, 0.8)",
        border: "1px solid rgba(255,255,255,0.12)",
        color: "#f8fafc",
        boxShadow: "0 22px 48px rgba(10,14,34,0.18)",
        zIndex: 40,
      }}
    >
      <div style={{display: "flex", alignItems: "center", gap: 12, minWidth: 220}}>
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
              color: "rgba(226,232,240,0.62)",
            }}
          >
            Voiceover cue
          </span>
          <span
            style={{
              fontFamily: DISPLAY_FONT,
              fontSize: 18,
              letterSpacing: "-0.03em",
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
          lineHeight: 1.44,
        }}
      >
        {captionText}
      </div>
    </div>
  );
};

const TimelineRail = ({
  currentFrame,
  timeline,
}: {
  currentFrame: number;
  timeline: ResolvedRommzProductLaunchHybridTimeline;
}) => {
  return (
    <div
      style={{
        position: "absolute",
        left: 92,
        right: 92,
        bottom: 36,
        display: "grid",
        gridTemplateColumns: `repeat(${timeline.scenes.length}, minmax(0, 1fr))`,
        gap: 12,
        zIndex: 40,
      }}
    >
      {timeline.scenes.map((segment) => {
        const palette = paletteMap[segment.scene.palette];
        const fill = clamp(
          (currentFrame - segment.startFrame) / Math.max(1, segment.durationInFrames),
          0,
          1,
        );

        return (
          <div
            key={segment.scene.id}
            style={{
              borderRadius: 24,
              background: "rgba(255,255,255,0.82)",
              border: "1px solid rgba(148,163,184,0.18)",
              padding: "12px 14px",
              boxShadow: "0 14px 30px rgba(15,23,42,0.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
                marginBottom: 10,
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontFamily: DISPLAY_FONT,
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#0f172a",
                  letterSpacing: "-0.02em",
                }}
              >
                {segment.scene.id.toUpperCase()}
              </span>
              <span
                style={{
                  fontFamily: UI_FONT,
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(51,65,85,0.48)",
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

const AudioLayer = ({
  props,
  timeline,
}: {
  props: RommzProductLaunchHybridProps;
  timeline: ResolvedRommzProductLaunchHybridTimeline;
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
          volume={(frame) =>
            isRommzProductLaunchHybridVoiceoverActive(frame, timeline)
              ? soundtrack.duckedVolume
              : soundtrack.volume
          }
        />
      ) : null}
      {voiceover.src ? (
        <Audio
          src={getMediaSrc(voiceover.src)}
          volume={(frame) => {
            if (voiceover.fadeInFrames <= 0) {
              return voiceover.volume;
            }

            return voiceover.volume * clamp(frame / voiceover.fadeInFrames, 0, 1);
          }}
        />
      ) : null}
    </>
  );
};

const renderScene = ({
  props,
  resolvedScene,
}: {
  props: RommzProductLaunchHybridProps;
  resolvedScene: ResolvedRommzProductLaunchHybridScene;
}) => {
  const {scene} = resolvedScene;

  if (!props.sceneToggles[scene.id]) {
    return null;
  }

  switch (scene.id) {
    case "hook":
      return <HookScene scene={scene} />;
    case "reveal":
      return <RevealScene captures={props.captures} scene={scene} />;
    case "search":
      return <SearchScene captures={props.captures} scene={scene} />;
    case "listings":
      return <ListingsScene captures={props.captures} scene={scene} />;
    case "romi":
      return <RomiScene captures={props.captures} scene={scene} />;
    case "services":
      return <ServicesScene captures={props.captures} scene={scene} />;
    case "cta":
      return (
        <CtaScene
          brandName={props.brandName}
          logoSrc={props.logoSrc}
          scene={scene}
          supportLabel={props.supportLabel}
          tagline={props.tagline}
          timing={props.timing}
        />
      );
    default:
      return null;
  }
};

export const RommzProductLaunchHybrid = (props: RommzProductLaunchHybridProps) => {
  const parsedProps = rommzProductLaunchHybridSchema.parse(props);
  const timeline = resolveRommzProductLaunchHybridTimeline(parsedProps);
  const currentFrame = useCurrentFrame();
  const {height, width} = useVideoConfig();
  const orbSize = Math.min(width, height) * 0.34;

  return (
    <AbsoluteFill
      style={{
        background: ROOT_BACKGROUND,
        color: "#0f172a",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -orbSize * 0.2,
          left: -orbSize * 0.06,
          width: orbSize,
          height: orbSize,
          borderRadius: orbSize,
          background: "rgba(15, 98, 254, 0.08)",
          filter: "blur(42px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: -orbSize * 0.06,
          bottom: -orbSize * 0.12,
          width: orbSize * 0.92,
          height: orbSize * 0.92,
          borderRadius: orbSize,
          background: "rgba(180, 83, 9, 0.08)",
          filter: "blur(40px)",
        }}
      />
      {timeline.scenes.map((resolvedScene) => (
        <Sequence
          key={resolvedScene.scene.id}
          from={resolvedScene.startFrame}
          durationInFrames={resolvedScene.durationInFrames}
        >
          {renderScene({props: parsedProps, resolvedScene})}
        </Sequence>
      ))}
      <CaptionStrip currentFrame={currentFrame} timeline={timeline} />
      <TimelineRail currentFrame={currentFrame} timeline={timeline} />
      <AudioLayer props={parsedProps} timeline={timeline} />
    </AbsoluteFill>
  );
};
