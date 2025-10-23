import { useState } from "react";
import { Button } from "./components/ui/button";
import { Toaster } from "./components/ui/sonner";
import { Home, Menu, X } from "lucide-react";
import { BottomNav } from "./components/BottomNav";
import { LandingPage } from "./components/LandingPage";
import { SearchPage } from "./components/SearchPage";
import { RoomDetailPage } from "./components/RoomDetailPage";
import { CompatibilityPage } from "./components/CompatibilityPage";
import { SwapRoomPage } from "./components/SwapRoomPage";
import { ProfilePage } from "./components/ProfilePage";
import { VerificationPage } from "./components/VerificationPage";
import { LoginPage } from "./components/LoginPage";
import { SupportServicesPage } from "./components/SupportServicesPage";
import { LocalPassportPage } from "./components/LocalPassportPage";
import { CommunityPage } from "./components/CommunityPage";
import { SettingsPage } from "./components/SettingsPage";
import { Chatbot } from "./components/Chatbot";
import { MessagesList } from "./components/MessagesList";
import { ChatDrawer } from "./components/ChatDrawer";
import { messagesData } from "./data/messages";

type Screen =
  | "login"
  | "home"
  | "search"
  | "room-detail"
  | "compatibility"
  | "swaproom"
  | "messages"
  | "profile"
  | "verification"
  | "support-services"
  | "community"
  | "local-passport"
  | "settings";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<Screen>("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedChatPerson, setSelectedChatPerson] = useState<any>(null);

  const handleLogin = () => {
    setIsLoggedIn(true);
    setCurrentScreen("home");
  };

  const handleNavigate = (screen: Screen) => {
    setCurrentScreen(screen);
    setMenuOpen(false);
  };

  const handleRoomClick = (id: string) => {
    setCurrentScreen("room-detail");
  };

  const handleMessageClick = (message: any) => {
    setSelectedChatPerson(message);
    setIsChatOpen(true);
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation - Desktop */}
      <header className="sticky top-0 bg-white border-b border-border z-50 hidden md:block">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => handleNavigate("home")}
            >
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <Home className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl">RoomZ</h2>
            </div>

            <nav className="flex items-center gap-6">
              <Button
                variant={currentScreen === "search" ? "default" : "ghost"}
                onClick={() => handleNavigate("search")}
                className="rounded-full"
              >
                Find a Room
              </Button>
              <Button
                variant={currentScreen === "compatibility" ? "default" : "ghost"}
                onClick={() => handleNavigate("compatibility")}
                className="rounded-full"
              >
                Find Roommates
              </Button>
              <Button
                variant={currentScreen === "swaproom" ? "default" : "ghost"}
                onClick={() => handleNavigate("swaproom")}
                className="rounded-full"
              >
                SwapRoom
              </Button>
              <Button
                variant={currentScreen === "verification" ? "default" : "ghost"}
                onClick={() => handleNavigate("verification")}
                className="rounded-full"
              >
                Get Verified
              </Button>
              <Button
                variant={currentScreen === "support-services" ? "default" : "ghost"}
                onClick={() => handleNavigate("support-services")}
                className="rounded-full"
              >
                Services
              </Button>
              <Button
                variant={currentScreen === "community" ? "default" : "ghost"}
                onClick={() => handleNavigate("community")}
                className="rounded-full"
              >
                Community
              </Button>
              <Button
                variant={currentScreen === "local-passport" ? "default" : "ghost"}
                onClick={() => handleNavigate("local-passport")}
                className="rounded-full"
              >
                Perks
              </Button>
              <Button
                variant={currentScreen === "profile" ? "default" : "ghost"}
                onClick={() => handleNavigate("profile")}
                className="rounded-full"
              >
                Profile
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="sticky top-0 bg-white border-b border-border z-50 md:hidden">
        <div className="px-4 py-3 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => handleNavigate("home")}
          >
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <h3>RoomZ</h3>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-full"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border-b border-border shadow-lg">
            <nav className="p-4 space-y-2">
              <Button
                variant={currentScreen === "search" ? "default" : "ghost"}
                onClick={() => handleNavigate("search")}
                className="w-full justify-start rounded-xl"
              >
                Find a Room
              </Button>
              <Button
                variant={currentScreen === "compatibility" ? "default" : "ghost"}
                onClick={() => handleNavigate("compatibility")}
                className="w-full justify-start rounded-xl"
              >
                Find Roommates
              </Button>
              <Button
                variant={currentScreen === "swaproom" ? "default" : "ghost"}
                onClick={() => handleNavigate("swaproom")}
                className="w-full justify-start rounded-xl"
              >
                SwapRoom
              </Button>
              <Button
                variant={currentScreen === "verification" ? "default" : "ghost"}
                onClick={() => handleNavigate("verification")}
                className="w-full justify-start rounded-xl"
              >
                Get Verified
              </Button>
              <Button
                variant={currentScreen === "support-services" ? "default" : "ghost"}
                onClick={() => handleNavigate("support-services")}
                className="w-full justify-start rounded-xl"
              >
                Services
              </Button>
              <Button
                variant={currentScreen === "community" ? "default" : "ghost"}
                onClick={() => handleNavigate("community")}
                className="w-full justify-start rounded-xl"
              >
                Community
              </Button>
              <Button
                variant={currentScreen === "local-passport" ? "default" : "ghost"}
                onClick={() => handleNavigate("local-passport")}
                className="w-full justify-start rounded-xl"
              >
                Perks
              </Button>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main>
        {currentScreen === "home" && <LandingPage onNavigate={handleNavigate} />}
        {currentScreen === "search" && <SearchPage onRoomClick={handleRoomClick} />}
        {currentScreen === "room-detail" && (
          <RoomDetailPage onBack={() => handleNavigate("search")} />
        )}
        {currentScreen === "compatibility" && (
          <CompatibilityPage onBack={() => handleNavigate("home")} />
        )}
        {currentScreen === "swaproom" && <SwapRoomPage />}
        {currentScreen === "profile" && <ProfilePage onNavigate={handleNavigate} />}
        {currentScreen === "verification" && (
          <VerificationPage onBack={() => handleNavigate("profile")} />
        )}
        {currentScreen === "messages" && (
          <div className="max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-8">
            <h1 className="mb-6">Messages</h1>
            <MessagesList messages={messagesData} onMessageClick={handleMessageClick} />
      </div>
        )}
        {currentScreen === "support-services" && (
          <SupportServicesPage onBack={() => handleNavigate("home")} />
        )}
        {currentScreen === "community" && <CommunityPage />}
        {currentScreen === "local-passport" && (
          <LocalPassportPage onBack={() => handleNavigate("home")} />
        )}
        {currentScreen === "settings" && (
          <SettingsPage onBack={() => handleNavigate("profile")} />
        )}
      </main>

      {/* Bottom Navigation - Mobile */}
      <BottomNav activeScreen={currentScreen} onNavigate={handleNavigate} />

      {/* Chatbot - Available on all screens */}
      <Chatbot />

      {/* Chat Drawer */}
      {selectedChatPerson && (
        <ChatDrawer
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          recipientName={selectedChatPerson.name}
          recipientRole="Roommate Seeker"
        />
      )}

      {/* Toast Notifications */}
      <Toaster />
      </div>
  );
}
