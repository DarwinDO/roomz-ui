import {Composition, Folder} from "remotion";

import {RommzBrandAd} from "./compositions/RommzBrandAd";
import {calculateRommzBrandAdMetadata} from "./compositions/rommzBrandAd.metadata";
import {rommzBrandAdFixture, rommzBrandAdSchema} from "./compositions/rommzBrandAd.schema";
import {RommzProductLaunchHybrid} from "./compositions/RommzProductLaunchHybrid";
import {calculateRommzProductLaunchHybridMetadata} from "./compositions/rommzProductLaunchHybrid.metadata";
import {
  rommzProductLaunchHybridFixture,
  rommzProductLaunchHybridSchema,
} from "./compositions/rommzProductLaunchHybrid.schema";

const FPS = 30;
const WIDTH = 1920;
const HEIGHT = 1080;
const FALLBACK_DURATION = 15 * FPS;

export const RemotionRoot = () => {
  return (
    <Folder name="Marketing">
      <Composition
        id="RommzBrandAd16x9"
        component={RommzBrandAd}
        schema={rommzBrandAdSchema}
        width={WIDTH}
        height={HEIGHT}
        fps={FPS}
        durationInFrames={FALLBACK_DURATION}
        defaultProps={rommzBrandAdFixture}
        calculateMetadata={calculateRommzBrandAdMetadata}
      />
      <Composition
        id="RommzProductLaunchHybrid16x9"
        component={RommzProductLaunchHybrid}
        schema={rommzProductLaunchHybridSchema}
        width={WIDTH}
        height={HEIGHT}
        fps={FPS}
        durationInFrames={33 * FPS}
        defaultProps={rommzProductLaunchHybridFixture}
        calculateMetadata={calculateRommzProductLaunchHybridMetadata}
      />
    </Folder>
  );
};
