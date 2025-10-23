import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, ArrowUpDown, Heart, MessageCircle, Eye } from "lucide-react";

interface ViewAllMatchesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewProfile?: (roommate: { name: string; role: string; match: number }) => void;
  onMessage?: (roommate: { name: string; role: string; match: number }) => void;
}

interface Roommate {
  id: number;
  name: string;
  match: number;
  avatar: string;
  role: string;
  major: string;
  year: string;
  bio: string;
  interests: string[];
  distance: string;
}

export function ViewAllMatchesModal({ isOpen, onClose, onViewProfile, onMessage }: ViewAllMatchesModalProps) {
  const [sortBy, setSortBy] = useState("compatibility");

  const roommates: Roommate[] = [
    {
      id: 1,
      name: "Alex Chen",
      match: 92,
      avatar: "",
      role: "Computer Science",
      major: "Computer Science",
      year: "Year 3",
      bio: "Tech enthusiast, clean and organized, love cooking!",
      interests: ["Gaming", "Coding", "Cooking"],
      distance: "0.5 mi",
    },
    {
      id: 2,
      name: "Jordan Kim",
      match: 88,
      avatar: "",
      role: "Business Major",
      major: "Business Administration",
      year: "Year 2",
      bio: "Early bird, non-smoker, enjoy quiet study time.",
      interests: ["Reading", "Gym", "Coffee"],
      distance: "0.3 mi",
    },
    {
      id: 3,
      name: "Taylor Swift",
      match: 85,
      avatar: "",
      role: "Engineering",
      major: "Mechanical Engineering",
      year: "Graduate",
      bio: "Music lover, respectful of space, weekend hiker.",
      interests: ["Music", "Hiking", "Photography"],
      distance: "0.8 mi",
    },
    {
      id: 4,
      name: "Morgan Lee",
      match: 82,
      avatar: "",
      role: "Psychology",
      major: "Psychology",
      year: "Year 4",
      bio: "Friendly and social, love hosting movie nights!",
      interests: ["Movies", "Psychology", "Yoga"],
      distance: "1.2 mi",
    },
    {
      id: 5,
      name: "Casey Brown",
      match: 79,
      avatar: "",
      role: "Graphic Design",
      major: "Graphic Design",
      year: "Year 3",
      bio: "Creative soul, night owl, plant parent 🌱",
      interests: ["Art", "Design", "Plants"],
      distance: "0.6 mi",
    },
    {
      id: 6,
      name: "Riley Davis",
      match: 76,
      avatar: "",
      role: "Biology",
      major: "Biology",
      year: "Year 2",
      bio: "Science nerd, clean freak, early sleeper.",
      interests: ["Science", "Running", "Podcasts"],
      distance: "1.0 mi",
    },
  ];

  const sortedRoommates = [...roommates].sort((a, b) => {
    if (sortBy === "compatibility") {
      return b.match - a.match;
    } else {
      // Sort by distance
      const distA = parseFloat(a.distance);
      const distB = parseFloat(b.distance);
      return distA - distB;
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] rounded-3xl p-0 max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-border shrink-0">
          <div className="flex items-center justify-between mb-2">
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Roommate Matches
            </DialogTitle>
            <Badge className="bg-secondary text-white">
              {roommates.length} matches
            </Badge>
          </div>
          <DialogDescription>
            Students interested in this room based on compatibility
          </DialogDescription>

          {/* Sort Options */}
          <div className="flex items-center gap-2 mt-4">
            <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px] h-9 rounded-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compatibility">Compatibility</SelectItem>
                <SelectItem value="proximity">Proximity</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </DialogHeader>

        {/* Roommate List */}
        <div className="overflow-y-auto p-6 space-y-4">
          {sortedRoommates.map((roommate) => (
            <div
              key={roommate.id}
              className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-5 border border-border hover:shadow-lg transition-all"
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <Avatar className="w-16 h-16 shrink-0 bg-gradient-to-br from-primary/20 to-secondary/20">
                  <AvatarFallback className="bg-transparent text-lg">
                    {roommate.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-base mb-0.5">{roommate.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {roommate.major} • {roommate.year}
                      </p>
                    </div>
                    <Badge className="bg-secondary text-white ml-2 shrink-0">
                      {roommate.match}% match
                    </Badge>
                  </div>

                  {/* Bio */}
                  <p className="text-sm text-gray-600 mb-3">{roommate.bio}</p>

                  {/* Interests */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {roommate.interests.map((interest, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="text-xs rounded-full"
                      >
                        {interest}
                      </Badge>
                    ))}
                    <Badge variant="outline" className="text-xs rounded-full text-primary border-primary">
                      📍 {roommate.distance}
                    </Badge>
                  </div>

                  {/* Compatibility Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">
                        Compatibility Score
                      </span>
                      <span className="text-xs text-primary">
                        {roommate.match}%
                      </span>
                    </div>
                    <Progress
                      value={roommate.match}
                      className="h-1.5"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 rounded-full bg-primary hover:bg-primary/90 h-9"
                      onClick={() => {
                        onClose();
                        onViewProfile?.({ name: roommate.name, role: roommate.role, match: roommate.match });
                      }}
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5" />
                      View Profile
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 rounded-full h-9"
                      onClick={() => {
                        onClose();
                        onMessage?.({ name: roommate.name, role: roommate.role, match: roommate.match });
                      }}
                    >
                      <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                      Message
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-full h-9 px-3"
                    >
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4 bg-muted/30 shrink-0">
          <p className="text-xs text-center text-muted-foreground">
            💡 Tip: Higher compatibility means similar lifestyle preferences and schedules
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
