import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { BottomNav } from '@/components/common/BottomNav';
import { Chatbot } from '@/components/common/Chatbot';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AppShell() {
  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation - Desktop */}
      <header className="sticky top-0 bg-white border-b border-border z-50 hidden md:block">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center gap-3 cursor-pointer">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <Home className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl">RoomZ</h2>
            </a>

            <nav className="flex items-center gap-6">
              <Button
                variant="ghost"
                onClick={() => window.location.href = '/search'}
                className="rounded-full"
              >
                Find a Room
              </Button>
              <Button
                variant="ghost"
                onClick={() => window.location.href = '/roommates'}
                className="rounded-full"
              >
                Find Roommates
              </Button>
              <Button
                variant="ghost"
                onClick={() => window.location.href = '/swap'}
                className="rounded-full"
              >
                SwapRoom
              </Button>
              <Button
                variant="ghost"
                onClick={() => window.location.href = '/verification'}
                className="rounded-full"
              >
                Get Verified
              </Button>
              <Button
                variant="ghost"
                onClick={() => window.location.href = '/support-services'}
                className="rounded-full"
              >
                Services
              </Button>
              <Button
                variant="ghost"
                onClick={() => window.location.href = '/community'}
                className="rounded-full"
              >
                Community
              </Button>
              <Button
                variant="ghost"
                onClick={() => window.location.href = '/local-passport'}
                className="rounded-full"
              >
                Perks
              </Button>
              <Button
                variant="ghost"
                onClick={() => window.location.href = '/profile'}
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
          <a href="/" className="flex items-center gap-2 cursor-pointer">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <h3>RoomZ</h3>
          </a>
        </div>
      </header>

      {/* Main Content with Suspense */}
      <main>
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-screen">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>

      {/* Bottom Navigation - Mobile */}
      <BottomNav />

      {/* Chatbot - Available on all screens */}
      <Chatbot />

      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
}

