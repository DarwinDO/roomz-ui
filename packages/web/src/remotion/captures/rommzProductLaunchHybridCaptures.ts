export const rommzProductLaunchHybridViewport = {
  width: 1440,
  height: 900,
} as const;

export const rommzProductLaunchHybridCaptureManifest = {
  "landing-hero": {
    fileName: "landing-hero.png",
    route: "/",
    label: "Landing hero fold",
  },
  "search-results": {
    fileName: "search-results.png",
    route: "/search",
    label: "Search results with filters and map",
  },
  "romi-chat": {
    fileName: "romi-chat.png",
    route: "/romi",
    label: "Romi concierge workspace",
  },
  "services-deals": {
    fileName: "services-deals.png",
    route: "/services",
    label: "Services deals catalog",
  },
  "payment-pricing": {
    fileName: "payment-pricing.png",
    route: "/payment",
    label: "Payment pricing panel",
  },
} as const;

export type RommzProductLaunchHybridCaptureId = keyof typeof rommzProductLaunchHybridCaptureManifest;

export const rommzProductLaunchHybridCaptureIds = Object.keys(
  rommzProductLaunchHybridCaptureManifest,
) as RommzProductLaunchHybridCaptureId[];

export const createRommzCapturePlaceholderDataUrl = ({
  accent = "#0f62fe",
  body,
  label,
}: {
  accent?: string;
  body: string;
  label: string;
}) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1440" height="900" viewBox="0 0 1440 900">
      <defs>
        <linearGradient id="bg" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stop-color="#f8fbff" />
          <stop offset="100%" stop-color="#fff4ea" />
        </linearGradient>
      </defs>
      <rect width="1440" height="900" fill="url(#bg)" rx="44" />
      <rect x="76" y="82" width="1288" height="736" rx="34" fill="#ffffff" stroke="#d7e3f5" stroke-width="4" />
      <rect x="120" y="126" width="244" height="34" rx="17" fill="${accent}" opacity="0.14" />
      <text x="120" y="212" fill="#0f172a" font-family="Plus Jakarta Sans, Arial, sans-serif" font-size="42" font-weight="700">${label}</text>
      <text x="120" y="284" fill="#475569" font-family="Manrope, Arial, sans-serif" font-size="28">${body}</text>
      <rect x="120" y="354" width="1200" height="364" rx="28" fill="#f5f9ff" stroke="#dbe7f8" stroke-width="3" />
      <rect x="164" y="402" width="420" height="38" rx="19" fill="${accent}" opacity="0.18" />
      <rect x="164" y="470" width="896" height="26" rx="13" fill="#dfe9f6" />
      <rect x="164" y="520" width="1030" height="26" rx="13" fill="#e8eef7" />
      <rect x="164" y="570" width="768" height="26" rx="13" fill="#e8eef7" />
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};
