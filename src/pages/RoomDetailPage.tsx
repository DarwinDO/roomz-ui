import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Wifi,
  ParkingCircle,
  UtensilsCrossed,
  WashingMachine,
  ShieldCheck,
  Heart,
  Share2,
  CheckCircle,
  Eye,
  Camera,
  Images,
  CalendarCheck,
  Map,
  Tv,
  AirVent,
  Bed,
  Sofa,
  MessageCircle,
} from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookViewingModal } from "@/components/modals/BookViewingModal";
import { ContactLandlordModal } from "@/components/modals/ContactLandlordModal";
import { GalleryModal } from "@/components/modals/GalleryModal";
import { ViewAllMatchesModal } from "@/components/modals/ViewAllMatchesModal";
import { RoommateProfileModal } from "@/components/modals/RoommateProfileModal";
import { ChatDrawer } from "@/components/common/ChatDrawer";

export default function RoomDetailPage() {
  const navigate = useNavigate();
  const onBack = () => navigate(-1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isBookViewingOpen, setIsBookViewingOpen] = useState(false);
  const [isContactLandlordOpen, setIsContactLandlordOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isViewAllMatchesOpen, setIsViewAllMatchesOpen] = useState(false);
  const [isRoommateProfileOpen, setIsRoommateProfileOpen] = useState(false);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  const [selectedRoommate, setSelectedRoommate] = useState<{ name: string; role: string; match: number } | null>(null);

  // Helper functions to manage mutually exclusive modals
  const closeAllModals = () => {
    setIsBookViewingOpen(false);
    setIsContactLandlordOpen(false);
    setIsGalleryOpen(false);
    setIsViewAllMatchesOpen(false);
    setIsRoommateProfileOpen(false);
    setIsChatDrawerOpen(false);
  };

  const openBookViewingModal = () => {
    closeAllModals();
    setIsBookViewingOpen(true);
  };

  const openContactLandlordModal = () => {
    closeAllModals();
    setIsContactLandlordOpen(true);
  };

  const openGalleryModal = () => {
    closeAllModals();
    setIsGalleryOpen(true);
  };

  const openViewAllMatchesModal = () => {
    closeAllModals();
    setIsViewAllMatchesOpen(true);
  };

  const openRoommateProfileModal = (roommate: { name: string; role: string; match: number }) => {
    setSelectedRoommate(roommate);
    closeAllModals();
    setIsRoommateProfileOpen(true);
  };

  const openChatDrawer = (roommate: { name: string; role: string; match: number }) => {
    setSelectedRoommate(roommate);
    closeAllModals();
    setIsChatDrawerOpen(true);
  };

  const images = [
    "https://images.unsplash.com/photo-1668089677938-b52086753f77?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBiZWRyb29tJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzYwNjM2NDM4fDA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1617325247661-675ab4b64ae2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwYmVkcm9vbXxlbnwxfHx8fDE3NjA2MzgzMDd8MA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcGFydG1lbnQlMjBsaXZpbmclMjByb29tfGVufDF8fHx8MTc2MDY3MzE2NXww&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3p5JTIwYmVkcm9vbXxlbnwxfHx8fDE3NjA2NzMxNjV8MA&ixlib=rb-4.1.0&q=80&w=1080",
  ];

  const amenities = [
    { icon: Wifi, label: "High-Speed WiFi" },
    { icon: ParkingCircle, label: "Parking" },
    { icon: UtensilsCrossed, label: "Shared Kitchen" },
    { icon: WashingMachine, label: "Laundry" },
    { icon: Tv, label: "Smart TV" },
    { icon: AirVent, label: "Air Conditioning" },
    { icon: Bed, label: "Furnished" },
    { icon: Sofa, label: "Living Room" },
  ];

  const roommates = [
    { name: "Alex Chen", match: 92, avatar: "", role: "Computer Science, Year 3" },
    { name: "Jordan Kim", match: 88, avatar: "", role: "Business Major, Year 2" },
    { name: "Taylor Swift", match: 85, avatar: "", role: "Engineering, Graduate" },
  ];

  return (
    <div className="min-h-screen bg-white pb-24 md:pb-8">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-border z-40 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Share2 className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Heart className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Image Gallery */}
        <div className="bg-black">
        {/* Main Image */}
        <div className="relative w-full aspect-[4/3] md:aspect-video">
          <ImageWithFallback
            src={images[currentImageIndex]}
            alt="Room"
            className="w-full h-full object-cover"
          />
          
          {/* Badge Overlays - Top Left */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            <Badge className="bg-white/95 text-primary backdrop-blur-sm border-0">
              <Camera className="w-3.5 h-3.5 mr-1.5" />
              Verified Photo
            </Badge>
            <Badge className="bg-primary/95 text-white backdrop-blur-sm border-0">
              <Eye className="w-3.5 h-3.5 mr-1.5" />
              360° View
            </Badge>
          </div>

          {/* Image Counter - Top Right */}
          <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
            {currentImageIndex + 1} / {images.length}
          </div>

          {/* Action Buttons - Bottom Right */}
          <div className="absolute bottom-4 right-4 flex gap-2 z-10">
            <Button
              variant="secondary"
              size="sm"
              onClick={openGalleryModal}
              className="rounded-full bg-white/95 hover:bg-white backdrop-blur-sm text-foreground shadow-lg min-h-[44px]"
            >
              <Images className="w-4 h-4 mr-2" />
              View Gallery
            </Button>
            <Button
              size="sm"
              onClick={openBookViewingModal}
              className="rounded-full bg-primary hover:bg-primary/90 shadow-lg min-h-[44px]"
            >
              <CalendarCheck className="w-4 h-4 mr-2" />
              Book Viewing
            </Button>
          </div>
        </div>

        {/* Thumbnail Gallery */}
        <div className="grid grid-cols-4 gap-1 md:gap-2 p-2 md:p-3 bg-black">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              aria-label={`View image ${index + 1}`}
              className={`relative aspect-video overflow-hidden rounded-lg transition-all ${
                index === currentImageIndex
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-black"
                  : "opacity-60 hover:opacity-100 hover:ring-1 hover:ring-white/50"
              }`}
            >
              <ImageWithFallback
                src={image}
                alt={`Room view ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {index === currentImageIndex && (
                <div className="absolute inset-0 pointer-events-none" />
              )}
            </button>
          ))}
        </div>
      </div>

        {/* Content */}
        <div className="px-4 md:px-6 py-6">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            {/* Title & Location */}
            <div>
              <h1 className="mb-3">Cozy Private Room near Campus</h1>
              <div className="flex items-center gap-2 text-gray-600 mb-4">
                <MapPin className="w-4 h-4" />
                <span>123 University Ave, University District</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-2 rounded-full h-8"
                >
                  <Map className="w-3.5 h-3.5 mr-1.5" />
                  View on Map
                </Button>
              </div>
            </div>

            {/* Compact Info Bar */}
            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl p-4 border border-primary/10">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1 text-primary">
                    <span className="text-2xl">$850</span>
                  </div>
                  <p className="text-xs text-gray-600">per month</p>
                </div>
                <div className="text-center border-l border-r border-border">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Calendar className="w-4 h-4 text-secondary" />
                    <span>Nov 1, 2025</span>
                  </div>
                  <p className="text-xs text-gray-600">Available from</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <ShieldCheck className="w-4 h-4 text-green-600" />
                    <span className="text-green-600">Verified</span>
                  </div>
                  <p className="text-xs text-gray-600">ID + Photos</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="mb-3">About this room</h3>
              <p className="text-gray-700 leading-relaxed">
                Beautiful private room in a modern 3-bedroom apartment. Perfect for students
                and young professionals. Located just 5 minutes walk from campus with easy
                access to public transportation. The room is fully furnished with a
                comfortable bed, desk, and closet space. You'll share a spacious kitchen and
                living room with two friendly roommates.
              </p>
            </div>

            {/* Amenities */}
            <div>
              <h3 className="mb-4">Amenities</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {amenities.map((amenity, index) => {
                  const Icon = amenity.icon;
                  return (
                    <div
                      key={index}
                      className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-xl hover:bg-primary/5 transition-colors"
                    >
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <span className="text-xs text-center">{amenity.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Landlord */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <Avatar>
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p>John Doe</p>
                    <Badge variant="outline" className="text-xs border-green-500 text-green-600">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified Host
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">Landlord since 2022</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-gray-600">Trust Score:</span>
                <Progress value={95} className="flex-1" />
                <span className="text-sm">95%</span>
              </div>
            </div>
          </div>

          {/* Sidebar - Sticky on Desktop */}
          <div className="space-y-6 md:sticky md:top-20 md:self-start">
            {/* CTA Buttons */}
            <div className="space-y-3 bg-white rounded-2xl border border-border p-4 shadow-sm">
              <Button
                onClick={openBookViewingModal}
                className="w-full bg-primary hover:bg-primary/90 rounded-full h-12 min-h-[44px]"
              >
                <CalendarCheck className="w-4 h-4 mr-2" />
                Book Viewing
              </Button>
              <Button
                onClick={openContactLandlordModal}
                variant="outline"
                className="w-full rounded-full h-12 min-h-[44px]"
              >
                Contact Landlord
              </Button>
            </div>

            {/* Roommate Matching */}
            <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-5 border border-primary/10">
              <div className="flex items-center justify-between mb-4">
                <h3>Potential Roommates</h3>
                <Badge variant="outline" className="bg-white">
                  3 matches
                </Badge>
              </div>
              <div className="space-y-3">
                {roommates.map((roommate, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl p-3 border border-border hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20">
                          {roommate.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{roommate.name}</p>
                        <p className="text-xs text-gray-500 truncate">{roommate.role}</p>
                      </div>
                      <Badge className="bg-secondary text-white shrink-0">
                        {roommate.match}%
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openRoommateProfileModal(roommate)}
                        className="rounded-full text-xs"
                      >
                        View Profile
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => openChatDrawer(roommate)}
                        className="rounded-full bg-primary hover:bg-primary/90 text-xs"
                      >
                        Message
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                onClick={openViewAllMatchesModal}
                variant="outline"
                className="w-full mt-4 rounded-full border-primary text-primary hover:bg-primary hover:text-white min-h-[44px]"
              >
                View All Matches
              </Button>
            </div>

            {/* Safety Note */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex gap-3">
                <ShieldCheck className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm mb-1">Safety First</p>
                  <p className="text-xs text-gray-600">
                    Always meet in person and verify the property before making any payments.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Modals */}
      <BookViewingModal
        isOpen={isBookViewingOpen}
        onClose={() => setIsBookViewingOpen(false)}
      />
      <ContactLandlordModal
        isOpen={isContactLandlordOpen}
        onClose={() => setIsContactLandlordOpen(false)}
      />
      <GalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        images={images}
        initialIndex={currentImageIndex}
      />
      <ViewAllMatchesModal
        isOpen={isViewAllMatchesOpen}
        onClose={() => setIsViewAllMatchesOpen(false)}
        onViewProfile={openRoommateProfileModal}
        onMessage={openChatDrawer}
      />
      {selectedRoommate && (
        <>
          <RoommateProfileModal
            isOpen={isRoommateProfileOpen}
            onClose={() => setIsRoommateProfileOpen(false)}
            onMessageClick={() => openChatDrawer(selectedRoommate)}
            roommate={selectedRoommate}
          />
          <ChatDrawer
            isOpen={isChatDrawerOpen}
            onClose={() => setIsChatDrawerOpen(false)}
            recipientName={selectedRoommate.name}
            recipientRole={selectedRoommate.role}
          />
        </>
      )}

      {/* Mobile Bottom Action Bar */}
      <div className="fixed bottom-16 left-0 right-0 md:hidden bg-white z-40" style={{ boxShadow: '0 -2px 6px rgba(0,0,0,0.08)' }}>
        <div className="px-4 py-3 pb-[calc(0.75rem+16px)]">
          <div className="flex gap-3">
            <Button
              onClick={openContactLandlordModal}
              variant="outline"
              className="flex-1 rounded-full h-12 border-primary text-primary hover:bg-primary hover:text-white"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Message Host
            </Button>
            <Button
              onClick={openBookViewingModal}
              className="flex-1 bg-primary hover:bg-primary/90 rounded-full h-12"
            >
              <CalendarCheck className="w-4 h-4 mr-2" />
              Book Viewing
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
