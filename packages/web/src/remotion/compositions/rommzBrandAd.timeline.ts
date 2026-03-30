import {type RommzBrandAdPalette, type RommzBrandAdProps, type RommzBrandAdScene} from "./rommzBrandAd.schema";

export type RommzBrandAdCue = {
  id: string;
  text: string;
  palette: RommzBrandAdPalette;
  startFrame: number;
  endFrame: number;
};

export type ResolvedRommzBrandAdScene = {
  scene: RommzBrandAdScene;
  index: number;
  startFrame: number;
  endFrame: number;
  durationInFrames: number;
  cue: RommzBrandAdCue;
};

export type ResolvedRommzBrandAdOutro = {
  startFrame: number;
  endFrame: number;
  durationInFrames: number;
  cue: RommzBrandAdCue;
  ctaStartFrame: number;
};

export type ResolvedRommzBrandAdTimeline = {
  introStartFrame: number;
  introEndFrame: number;
  scenes: ResolvedRommzBrandAdScene[];
  outro: ResolvedRommzBrandAdOutro;
  cues: RommzBrandAdCue[];
  totalDurationInFrames: number;
};

export const countWords = (text: string) => {
  const cleaned = text.trim().replace(/\s+/g, " ");

  return cleaned.length === 0 ? 0 : cleaned.split(" ").length;
};

export const estimateFramesFromCopy = ({
  text,
  framesPerWord,
  minimumFrames,
  tailFrames,
}: {
  text: string;
  framesPerWord: number;
  minimumFrames: number;
  tailFrames: number;
}) => {
  return Math.max(minimumFrames, countWords(text) * framesPerWord + tailFrames);
};

export const resolveRommzBrandAdTimeline = (
  props: RommzBrandAdProps,
): ResolvedRommzBrandAdTimeline => {
  const {scenes, outro, timing} = props;
  const introStartFrame = 0;
  const introEndFrame = timing.introFrames;

  const resolvedScenes: ResolvedRommzBrandAdScene[] = [];
  let previousEndFrame = introEndFrame;

  scenes.forEach((scene, index) => {
    const durationInFrames = estimateFramesFromCopy({
      text: scene.voiceoverText,
      framesPerWord: timing.framesPerWord,
      minimumFrames: Math.max(timing.baseSceneFrames, scene.minDurationInFrames),
      tailFrames: timing.sceneTailFrames,
    });
    const startFrame =
      index === 0 ? introEndFrame : Math.max(introEndFrame, previousEndFrame - timing.overlapFrames);
    const endFrame = startFrame + durationInFrames;
    const cue: RommzBrandAdCue = {
      id: `${scene.id}-cue`,
      text: scene.voiceoverText,
      palette: scene.palette,
      startFrame: startFrame + 6,
      endFrame: Math.max(startFrame + 18, endFrame - Math.max(12, timing.overlapFrames)),
    };

    resolvedScenes.push({
      scene,
      index,
      startFrame,
      endFrame,
      durationInFrames,
      cue,
    });
    previousEndFrame = endFrame;
  });

  const outroDurationInFrames = estimateFramesFromCopy({
    text: outro.voiceoverText,
    framesPerWord: timing.framesPerWord,
    minimumFrames: Math.max(timing.outroFrames, outro.minDurationInFrames),
    tailFrames: timing.sceneTailFrames,
  });
  const outroStartFrame = Math.max(introEndFrame, previousEndFrame - timing.overlapFrames);
  const outroEndFrame = outroStartFrame + outroDurationInFrames;
  const outroCue: RommzBrandAdCue = {
    id: "outro-cue",
    text: outro.voiceoverText,
    palette: "primary",
    startFrame: outroStartFrame + 8,
    endFrame: Math.max(outroStartFrame + 20, outroEndFrame - 8),
  };

  return {
    introStartFrame,
    introEndFrame,
    scenes: resolvedScenes,
    outro: {
      startFrame: outroStartFrame,
      endFrame: outroEndFrame,
      durationInFrames: outroDurationInFrames,
      cue: outroCue,
      ctaStartFrame: Math.max(outroStartFrame, outroEndFrame - timing.ctaHoldFrames),
    },
    cues: [...resolvedScenes.map((scene) => scene.cue), outroCue],
    totalDurationInFrames: outroEndFrame,
  };
};

export const getActiveCue = (frame: number, timeline: ResolvedRommzBrandAdTimeline) => {
  return timeline.cues.find((cue) => frame >= cue.startFrame && frame < cue.endFrame) ?? null;
};

export const isVoiceoverActive = (frame: number, timeline: ResolvedRommzBrandAdTimeline) => {
  return getActiveCue(frame, timeline) !== null;
};
