import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileEditModal } from "@/components/modals/ProfileEditModal";
import { useAuth } from "@/contexts";
import { UPGRADE_SOURCES } from "@/constants/tracking";
import { useFavorites } from "@/hooks/useFavorites";
import { transformRoomToCardProps } from "@/utils/room";
import { toast } from "sonner";
import { Heart, Settings, CalendarCheck } from "lucide-react";

// Components
import { ProfileHeader } from "./profile/components/ProfileHeader";
import { UpgradeBanner } from "./profile/components/UpgradeBanner";
import { FavoritesTab } from "./profile/components/FavoritesTab";
import { SettingsTab } from "./profile/components/SettingsTab";
import { BookingsTab } from "./profile/components/BookingsTab";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile, signOut, isEmailVerified } = useAuth();

  // Data Fetching
  const { favorites, loading: favoritesLoading, error: favoritesError, refetch: refetchFavorites, toggleFavorite } = useFavorites();

  // Memoized Data
  const savedRooms = useMemo(() => {
    return favorites
      .filter(fav => fav.room)
      .map(fav => transformRoomToCardProps(fav.room!, true));
  }, [favorites]);

  const trustScore = useMemo(() => {
    let score = 0;
    if (isEmailVerified || profile?.email_verified) score += 30;
    if (profile?.phone_verified) score += 20;
    if (profile?.id_card_verified) score += 30;
    if (profile?.student_card_verified) score += 20;
    return score;
  }, [isEmailVerified, profile?.email_verified, profile?.phone_verified, profile?.id_card_verified, profile?.student_card_verified]);

  // UI States
  const [activeTab, setActiveTab] = useState("favorites");
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // Effects
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "settings") setActiveTab("settings");
  }, [searchParams]);

  // Handlers
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error("Không thể đăng xuất");
    }
  };

  return (
    <div className="pb-20 md:pb-8">
      <ProfileHeader
        user={user}
        profile={profile}
        isEmailVerified={isEmailVerified}
        trustScore={trustScore}
        onEditProfile={() => setIsEditProfileOpen(true)}
      />

      <UpgradeBanner
        onUpgrade={() => navigate(`/payment?source=${UPGRADE_SOURCES.PROFILE_BANNER}`)}
        isPremium={profile?.is_premium}
      />

      <div className="px-6 max-w-6xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 rounded-xl">
            <TabsTrigger value="favorites">
              <Heart className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Yêu thích</span>
              <span className="sm:hidden">Yêu</span>
            </TabsTrigger>
            <TabsTrigger value="bookings">
              <CalendarCheck className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Lịch hẹn</span>
              <span className="sm:hidden">Hẹn</span>
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Cài đặt</span>
              <span className="sm:hidden">Cài</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="favorites">
            <FavoritesTab
              savedRooms={savedRooms}
              loading={favoritesLoading}
              error={favoritesError}
              onRefetch={refetchFavorites}
              onRemoveFavorite={async (id) => { await toggleFavorite(id); }}
            />
          </TabsContent>

          <TabsContent value="bookings">
            <BookingsTab />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab
              profile={profile}
              isEmailVerified={isEmailVerified}
              trustScore={trustScore}
              onEditProfile={() => setIsEditProfileOpen(true)}
              onSignOut={handleSignOut}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <ProfileEditModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />
    </div>
  );
}
