import { useEffect, useState } from "react";

type ThreePilotOptions = {
  enabled: boolean;
  minWidth?: number;
};

type NavigatorWithHardwareHints = Navigator & {
  deviceMemory?: number;
  connection?: {
    saveData?: boolean;
  };
};

function canRenderThreePilot(minWidth: number) {
  if (typeof window === "undefined") {
    return false;
  }

  let webglReady = false;

  try {
    const canvas = document.createElement("canvas");
    webglReady = !!(
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")
    );
  } catch {
    webglReady = false;
  }

  const navigatorHints = navigator as NavigatorWithHardwareHints;
  const pointerCoarse = window.matchMedia("(pointer: coarse)").matches;
  const reducedData = navigatorHints.connection?.saveData ?? false;
  const deviceMemory = navigatorHints.deviceMemory ?? 8;
  const cpuCores = navigator.hardwareConcurrency ?? 8;

  return (
    window.innerWidth >= minWidth &&
    webglReady &&
    !pointerCoarse &&
    !reducedData &&
    deviceMemory >= 4 &&
    cpuCores >= 4
  );
}

export function useThreePilotEnabled({ enabled, minWidth = 1180 }: ThreePilotOptions) {
  const [isReady, setIsReady] = useState(() => (enabled ? canRenderThreePilot(minWidth) : false));

  useEffect(() => {
    if (!enabled) {
      setIsReady(false);
      return;
    }

    const evaluate = () => {
      setIsReady(canRenderThreePilot(minWidth));
    };

    evaluate();
    window.addEventListener("resize", evaluate);

    return () => {
      window.removeEventListener("resize", evaluate);
    };
  }, [enabled, minWidth]);

  return isReady;
}
