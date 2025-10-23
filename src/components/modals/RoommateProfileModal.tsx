import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MessageCircle, X, GraduationCap, MapPin, Calendar, Moon, Sparkles, Book, Volume2 } from "lucide-react";

interface RoommateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMessageClick: () => void;
  roommate: {
    name: string;
    role: string;
    match: number;
    age?: number;
    university?: string;
    major?: string;
    bio?: string;
  };
}

export function RoommateProfileModal({ isOpen, onClose, onMessageClick, roommate }: RoommateProfileModalProps) {
  const interests = ["Music", "Cooking", "Hiking", "Gaming", "Reading", "Yoga"];
  const lifestylePrefs = [
    { icon: Moon, label: "Sleep Schedule", value: "Early Bird (10 PM - 6 AM)" },
    { icon: Sparkles, label: "Cleanliness", value: "Very tidy" },
    { icon: Book, label: "Study Habits", value: "Quiet study, library preferred" },
    { icon: Volume2, label: "Noise Tolerance", value: "Prefers quiet environment" },
  ];

  const compatibilityBreakdown = [
    { category: "Communication", score: 95 },
    { category: "Cleanliness", score: 92 },
    { category: "Study Habits", score: 88 },
    { category: "Social Life", score: 85 },
    { category: "Sleep Schedule", score: 90 },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Roommate Profile</DialogTitle>
          <DialogDescription>
            View detailed compatibility information and lifestyle preferences
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Header with Avatar */}
          <div className="flex flex-col items-center text-center">
            <Avatar className="w-24 h-24 mb-4">
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-2xl">
                {roommate.name.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <h2 className="mb-1">
              {roommate.name}
              {roommate.age && `, ${roommate.age}`}
            </h2>
            <p className="text-gray-600 mb-1">
              {roommate.university || roommate.role}
            </p>
            {roommate.major && (
              <p className="text-sm text-gray-500 mb-2">{roommate.major}</p>
            )}
            <Badge className="bg-gradient-to-r from-secondary to-primary text-white px-4 py-1 shadow-md">
              {roommate.match}% Match
            </Badge>
          </div>

          {/* About Section */}
          <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-5 border border-primary/10">
            <h3 className="mb-3 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              About
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              {roommate.bio || `Hey! I'm a ${roommate.role.toLowerCase()} looking for a clean, respectful roommate who values
              communication and shared living space. I love staying organized and believe in creating
              a comfortable home environment where we can both thrive academically and socially.`}
            </p>
          </div>

          {/* Interests */}
          <div>
            <h3 className="mb-3">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {interests.map((interest, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="bg-white border-primary/20 text-primary px-3 py-1"
                >
                  {interest}
                </Badge>
              ))}
            </div>
          </div>

          {/* Lifestyle Preferences */}
          <div className="bg-white rounded-2xl border border-border p-5">
            <h3 className="mb-4">Lifestyle Preferences</h3>
            <div className="space-y-4">
              {lifestylePrefs.map((pref, index) => {
                const Icon = pref.icon;
                return (
                  <div key={index} className="flex gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm mb-1">{pref.label}</p>
                      <p className="text-xs text-gray-600">{pref.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Compatibility Breakdown */}
          <div className="bg-gradient-to-br from-secondary/5 to-primary/5 rounded-2xl p-5 border border-primary/10">
            <h3 className="mb-4">Compatibility Breakdown</h3>
            <div className="space-y-4">
              {compatibilityBreakdown.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm">{item.category}</p>
                    <p className="text-sm text-primary">{item.score}%</p>
                  </div>
                  <Progress value={item.score} className="h-2" />
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => {
                onClose();
                onMessageClick();
              }}
              className="flex-1 bg-primary hover:bg-primary/90 rounded-full h-12"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Message
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 rounded-full h-12"
            >
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
