import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoomCard } from "@/components/common/RoomCard";
import { RefreshCw, Plus, Calendar, DollarSign, Home } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import SubletDetailPage from "@/pages/SubletDetailPage";
import { ConfirmBookingModal } from "@/components/modals/ConfirmBookingModal";
import { ChatDrawer } from "@/components/common/ChatDrawer";

export default function SwapRoomPage() {
  const [selectedSublet, setSelectedSublet] = useState<any | null>(null);
  const [isBookSubletOpen, setIsBookSubletOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const myListings = [
    {
      id: "my-1",
      image: "https://images.unsplash.com/photo-1617325247661-675ab4b64ae2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwYmVkcm9vbXxlbnwxfHx8fDE3NjA2MzgzMDd8MA&ixlib=rb-4.1.0&q=80&w=1080",
      title: "My Room - Summer Sublet",
      location: "University District",
      price: 750,
      distance: "Available",
      verified: true,
      available: true,
    },
  ];

  const swapSuggestions = [
    {
      id: "swap-1",
      image: "https://images.unsplash.com/photo-1668089677938-b52086753f77?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBiZWRyb29tJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzYwNjM2NDM4fDA&ixlib=rb-4.1.0&q=80&w=1080",
      title: "Downtown Studio - 2 Months",
      location: "Downtown",
      price: 950,
      distance: "Jun-Jul 2025",
      verified: true,
      available: true,
      matchPercentage: 88,
    },
    {
      id: "swap-2",
      image: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcGFydG1lbnQlMjBsaXZpbmclMjByb29tfGVufDF8fHx8MTc2MDY3MzE2NXww&ixlib=rb-4.1.0&q=80&w=1080",
      title: "Cozy Room Near Campus",
      location: "College Area",
      price: 680,
      distance: "May-Aug 2025",
      verified: false,
      available: true,
      matchPercentage: 85,
    },
    {
      id: "swap-3",
      image: "https://images.unsplash.com/photo-1579632151052-92f741fb9b79?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3p5JTIwc3R1ZGVudCUyMHJvb218ZW58MXx8fHwxNzYwNjA0MDMzfDA&ixlib=rb-4.1.0&q=80&w=1080",
      title: "Bright Room with Balcony",
      location: "West Side",
      price: 820,
      distance: "Jun-Sep 2025",
      verified: true,
      available: true,
      matchPercentage: 79,
    },
  ];

  const handleSubletClick = (sublet: any) => {
    setSelectedSublet(sublet);
  };

  const handleBack = () => {
    setSelectedSublet(null);
  };

  const handleBookSublet = () => {
    setIsBookSubletOpen(true);
  };

  const handleMessageHost = () => {
    setIsChatOpen(true);
  };

  if (selectedSublet) {
    return (
      <>
        <SubletDetailPage
          onBack={handleBack}
          onBookSublet={handleBookSublet}
          onMessageHost={handleMessageHost}
          sublet={selectedSublet}
        />
        <ConfirmBookingModal
          isOpen={isBookSubletOpen}
          onClose={() => setIsBookSubletOpen(false)}
          sublet={selectedSublet}
        />
        <ChatDrawer
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          recipientName="Sarah Chen"
          recipientRole="Host"
        />
      </>
    );
  }

  return (
    <div className="pb-20 md:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 to-secondary/10 px-6 py-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="w-8 h-8 text-primary" />
          </div>
          <h1 className="mb-2">SwapRoom</h1>
          <p className="text-gray-600">
            Flexible subletting for short-term stays and room swaps
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="browse">Browse Sublets</TabsTrigger>
            <TabsTrigger value="mylistings">My Listings</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            <Card className="p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-secondary/5 border-0">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h3 className="mb-2">Looking for a short-term stay?</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Find verified sublets from students traveling for internships, study
                    abroad, or summer break.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-white">1-3 months</Badge>
                    <Badge variant="secondary" className="bg-white">Flexible dates</Badge>
                    <Badge variant="secondary" className="bg-white">No long-term commitment</Badge>
                  </div>
                </div>
              </div>
            </Card>

            <div>
              <h3 className="mb-4">Available Sublets</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {swapSuggestions.map((room) => (
                  <div key={room.id} onClick={() => handleSubletClick(room)} className="cursor-pointer">
                    <RoomCard {...room} />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="mylistings" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3>Your Sublet Listings</h3>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90 rounded-full">
                    <Plus className="w-4 h-4 mr-2" />
                    List Your Room
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>List Your Room for Sublet</DialogTitle>
                    <DialogDescription>
                      Fill out the details to list your room for short-term subletting.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Room Title</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Cozy Studio Near Campus"
                        className="rounded-xl"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="start-date">Start Date</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="start-date"
                            type="date"
                            className="pl-10 rounded-xl"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end-date">End Date</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="end-date"
                            type="date"
                            className="pl-10 rounded-xl"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price">Monthly Price</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="price"
                          type="number"
                          placeholder="850"
                          className="pl-10 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe your room, amenities, and why it's a great sublet..."
                        className="rounded-xl min-h-32"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Room Type</Label>
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant="outline"
                          className="cursor-pointer hover:bg-primary hover:text-white"
                        >
                          Private Room
                        </Badge>
                        <Badge
                          variant="outline"
                          className="cursor-pointer hover:bg-primary hover:text-white"
                        >
                          Shared Room
                        </Badge>
                        <Badge
                          variant="outline"
                          className="cursor-pointer hover:bg-primary hover:text-white"
                        >
                          Studio
                        </Badge>
                        <Badge
                          variant="outline"
                          className="cursor-pointer hover:bg-primary hover:text-white"
                        >
                          Entire Place
                        </Badge>
                      </div>
                    </div>

                    <Button className="w-full bg-primary hover:bg-primary/90 rounded-full h-12">
                      <Home className="w-4 h-4 mr-2" />
                      Publish Listing
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {myListings.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {myListings.map((room) => (
                  <RoomCard key={room.id} {...room} />
                ))}
              </div>
            ) : (
              <Card className="p-12 rounded-2xl text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <RefreshCw className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="mb-2">No listings yet</h3>
                <p className="text-gray-600 mb-6">
                  Going away for the summer? List your room and find someone to sublet!
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90 rounded-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Listing
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>List Your Room for Sublet</DialogTitle>
                      <DialogDescription>
                        Fill out the details to list your room for short-term subletting.
                      </DialogDescription>
                    </DialogHeader>
                    <p className="text-sm text-gray-600 py-4">
                      Listing form would appear here...
                    </p>
                  </DialogContent>
                </Dialog>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* How it Works */}
        <Card className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-secondary/5 to-primary/5 border-0">
          <h3 className="mb-4 text-center">How SwapRoom Works</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg">
                1
              </div>
              <p className="text-sm">
                <strong>List your room</strong> with dates and price
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg">
                2
              </div>
              <p className="text-sm">
                <strong>Get matched</strong> with verified subletters
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg">
                3
              </div>
              <p className="text-sm">
                <strong>Secure payment</strong> through RoomZ platform
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
