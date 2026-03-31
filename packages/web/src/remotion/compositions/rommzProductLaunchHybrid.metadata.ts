import type {CalculateMetadataFunction} from "remotion";

import {rommzProductLaunchHybridSchema, type RommzProductLaunchHybridProps} from "./rommzProductLaunchHybrid.schema";
import {resolveRommzProductLaunchHybridTimeline} from "./rommzProductLaunchHybrid.timeline";

export const calculateRommzProductLaunchHybridMetadata: CalculateMetadataFunction<
  RommzProductLaunchHybridProps
> = ({props}) => {
  const parsedProps = rommzProductLaunchHybridSchema.parse(props);
  const timeline = resolveRommzProductLaunchHybridTimeline(parsedProps);

  return {
    defaultOutName: "rommz-product-launch-hybrid-16x9.mp4",
    durationInFrames: timeline.totalDurationInFrames,
    fps: parsedProps.timing.fps,
  };
};
