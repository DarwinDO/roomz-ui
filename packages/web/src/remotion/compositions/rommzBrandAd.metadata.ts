import type {CalculateMetadataFunction} from "remotion";

import {resolveRommzBrandAdTimeline} from "./rommzBrandAd.timeline";
import {rommzBrandAdSchema, type RommzBrandAdProps} from "./rommzBrandAd.schema";

export const calculateRommzBrandAdMetadata: CalculateMetadataFunction<RommzBrandAdProps> = ({
  props,
}) => {
  const parsedProps = rommzBrandAdSchema.parse(props);
  const timeline = resolveRommzBrandAdTimeline(parsedProps);

  return {
    defaultOutName: "rommz-brand-ad-16x9.mp4",
    durationInFrames: timeline.totalDurationInFrames,
    fps: parsedProps.timing.fps,
  };
};
