import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { RoommateNav } from "./components/common/RoommateNav";
import { PageLoading } from "./components/common/LoadingSpinner";
import { useRoommateProfileQuery } from "@/hooks/useRoommatesQuery";

export function RoommateLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { loading, hasProfile } = useRoommateProfileQuery();

  useEffect(() => {
    if (!loading && !hasProfile) {
      navigate("/roommates/setup", { replace: true });
    }
  }, [loading, hasProfile, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PageLoading message="Đang tải..." />
      </div>
    );
  }

  if (!hasProfile) {
    return null;
  }

  if (location.pathname === "/roommates") {
    return (
      <div className="min-h-screen bg-background">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 pb-12 pt-28 md:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between rounded-[28px] border border-border/70 bg-surface-container-low p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Roommate console
            </p>
            <h2 className="mt-2 text-2xl">Quản lý hành trình ở ghép của bạn.</h2>
          </div>
          <RoommateNav />
        </div>
        <Outlet />
      </div>
    </div>
  );
}
