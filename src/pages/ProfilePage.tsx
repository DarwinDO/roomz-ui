import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatDrawer } from "@/components/common/ChatDrawer";
import { UpgradeRoomZPlusModal } from "@/components/modals/UpgradeRoomZPlusModal";
import { ProfileEditModal } from "@/components/modals/ProfileEditModal";
import { useAuth } from "@/contexts";
import { supabase } from "@/lib/supabase";
import { useFavorites } from "@/hooks/useFavorites";
import { useProfileMessages } from "@/hooks/useMessages";
import { toast } from "sonner";
import type { RoomWithDetails } from "@/services/rooms";
import { Heart, MessageCircle, Settings } from "lucide-react";

// Components
import { ProfileHeader } from "./profile/components/ProfileHeader";
import { UpgradeBanner } from "./profile/components/UpgradeBanner";
import { FavoritesTab } from "./profile/components/FavoritesTab";
import { MessagesTab } from "./profile/components/MessagesTab";
import { SettingsTab } from "./profile/components/SettingsTab";

// Helper function to transform room data to RoomCard props
function transformRoomToCardProps(room: RoomWithDetails) {
  const primaryImage = room.images?.find(img => img.is_primary) || room.images?.[0];
  const imageUrl = primaryImage?.image_url || 'https://images.unsplash.com/photo-1668089677938-b52086753f77?w=400';
  const location = [room.district, room.city].filter(Boolean).join(', ') || room.address;
  const distance = room.latitude && room.longitude ? `${(Math.random() * 5 + 0.5).toFixed(1)} km` : 'N/A';

  return {
    id: room.id,
    image: imageUrl,
    title: room.title,
    location,
    price: Number(room.price_per_month),
    distance,
    verified: room.is_verified || false,
    available: room.is_available || false,
    matchPercentage: Math.floor(Math.random() * 20 + 75),
  };
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile, signOut, isEmailVerified, refreshUser } = useAuth();

  // Data Fetching
  const { favorites, loading: favoritesLoading, error: favoritesError, refetch: refetchFavorites, toggleFavorite } = useFavorites();
  const { messages: profileMessages, loading: messagesLoading, error: messagesError, unreadCount: messagesUnreadCount } = useProfileMessages();

  // Memoized Data
  const savedRooms = useMemo(() => {
    return favorites.filter(fav => fav.room).map(fav => transformRoomToCardProps(fav.room!));
  }, [favorites]);

  // UI States
  const [activeTab, setActiveTab] = useState("favorites");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedChatPerson, setSelectedChatPerson] = useState<{
    name: string;
    avatar?: string;
    lastMessage?: string;
  } | null>(null);

  // Effects
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "messages") setActiveTab("messages");
  }, [searchParams]);

  // Helpers
  const getUserInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user?.email?.charAt(0).toUpperCase() || '?';
  };

  const calculateTrustScore = () => {
    let score = 0;
    if (isEmailVerified || profile?.email_verified) score += 30;
    if (profile?.phone_verified) score += 20;
    if (profile?.id_card_verified) score += 30;
    if (profile?.student_card_verified) score += 20;
    return score;
  };

  const trustScore = calculateTrustScore();

  // Handlers
  const handleMessageClick = (message: { name: string; avatar?: string; lastMessage?: string; conversationId?: string }) => {
    if (message.conversationId) navigate(`/messages?conversation=${message.conversationId}`);
    else navigate('/messages');
  };

  const handleUpdateProfile = async (formData: any) => {
    if (!user) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase.from('users').update({
        full_name: formData.fullName,
        major: formData.major,
        university: formData.university,
        phone: formData.phone,
        bio: formData.bio,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id);

      if (error) throw error;
      toast.success("Cập nhật hồ sơ thành công!");
      await refreshUser();
      setIsEditProfileOpen(false); // Close modal if open
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || "Không thể cập nhật hồ sơ");
    } finally {
      setIsUpdating(false);
    }
  };

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
        getUserInitials={getUserInitials}
        onEditProfile={() => setIsEditProfileOpen(true)}
      />

      <UpgradeBanner onUpgrade={() => setIsUpgradeModalOpen(true)} />

      <div className="px-6 max-w-6xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 rounded-xl">
            <TabsTrigger value="favorites">
              <Heart className="w-4 h-4 mr-2" />
              Yêu thích
            </TabsTrigger>
            <TabsTrigger value="messages">
              <MessageCircle className="w-4 h-4 mr-2" />
              Tin nhắn
              {messagesUnreadCount > 0 && (
                <span className="ml-2 bg-destructive text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px]">
                  {messagesUnreadCount > 9 ? '9+' : messagesUnreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              Cài đặt
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

          <TabsContent value="messages">
            <MessagesTab
              messages={profileMessages}
              loading={messagesLoading}
              error={messagesError}
              onMessageClick={handleMessageClick}
            />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab
              profile={profile}
              isEmailVerified={isEmailVerified}
              trustScore={trustScore}
              onUpdateProfile={handleUpdateProfile}
              onSignOut={handleSignOut}
              isUpdating={isUpdating}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <UpgradeRoomZPlusModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onSuccess={() => toast.success("Thành công! RoomZ+ đã được kích hoạt.")}
      />
      <ProfileEditModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        onSave={() => toast.success("Cập nhật hồ sơ thành công!")}
      />
      {selectedChatPerson && (
        <ChatDrawer
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          recipientName={selectedChatPerson.name}
          recipientRole="Người tìm bạn cùng phòng"
        />
      )}
    </div>
  );
}
