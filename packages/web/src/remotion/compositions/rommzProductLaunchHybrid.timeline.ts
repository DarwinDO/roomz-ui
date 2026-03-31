import {
  type RommzProductLaunchHybridPalette,
  type RommzProductLaunchHybridProps,
  type RommzProductLaunchHybridScene,
} from "./rommzProductLaunchHybrid.schema";

export type RommzProductLaunchHybridCue = {
  id: string;
  text: string;
  palette: RommzProductLaunchHybridPalette;
  startFrame: number;
  endFrame: number;
};

export type ResolvedRommzProductLaunchHybridScene = {
  scene: RommzProductLaunchHybridScene;
  index: number;
  startFrame: number;
  endFrame: number;
  durationInFrames: number;
  cue: RommzProductLaunchHybridCue;
};

export type ResolvedRommzProductLaunchHybridTimeline = {
  scenes: ResolvedRommzProductLaunchHybridScene[];
  cues: RommzProductLaunchHybridCue[];
  totalDurationInFrames: number;
};

export const resolveRommzProductLaunchHybridTimeline = (
  props: RommzProductLaunchHybridProps,
): ResolvedRommzProductLaunchHybridTimeline => {
  let cursor = 0;

  const scenes = props.scenes.map((scene, index) => {
    const startFrame = cursor;
    const endFrame = startFrame + scene.durationInFrames;
    cursor = endFrame;

    const cue: RommzProductLaunchHybridCue = {
      id: `${scene.id}-cue`,
      text: scene.voiceoverText,
      palette: scene.palette,
      startFrame: startFrame + props.timing.captionLeadInFrames,
      endFrame: Math.max(startFrame + 18, endFrame - props.timing.captionTailFrames),
    };

    return {
      scene,
      index,
      startFrame,
      endFrame,
      durationInFrames: scene.durationInFrames,
      cue,
    };
  });

  return {
    scenes,
    cues: scenes.map((scene) => scene.cue),
    totalDurationInFrames: cursor,
  };
};

export const getActiveRommzProductLaunchHybridCue = (
  frame: number,
  timeline: ResolvedRommzProductLaunchHybridTimeline,
) => {
  return timeline.cues.find((cue) => frame >= cue.startFrame && frame < cue.endFrame) ?? null;
};

export const isRommzProductLaunchHybridVoiceoverActive = (
  frame: number,
  timeline: ResolvedRommzProductLaunchHybridTimeline,
) => {
  return getActiveRommzProductLaunchHybridCue(frame, timeline) !== null;
};
