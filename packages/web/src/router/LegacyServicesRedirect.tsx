import { Navigate, useLocation } from "react-router-dom";

interface LegacyServicesRedirectProps {
  tab: "services" | "deals";
}

export default function LegacyServicesRedirect({
  tab,
}: LegacyServicesRedirectProps) {
  const location = useLocation();
  const nextParams = new URLSearchParams(location.search);
  nextParams.set("tab", tab);

  return <Navigate to={`/services?${nextParams.toString()}`} replace />;
}
