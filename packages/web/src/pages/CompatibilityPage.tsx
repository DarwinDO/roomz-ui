import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  Coffee,
  Moon,
  Sun,
  Music,
  Users,
  BookOpen,
  Dumbbell,
  MessageCircle,
  CheckCircle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RoommateProfileModal } from "@/components/modals/RoommateProfileModal";
import { ChatDrawer } from "@/components/common/ChatDrawer";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function CompatibilityPage() {
  const navigate = useNavigate();
  const onBack = () => navigate(-1);
  
  const [currentStep, setCurrentStep] = useState<"quiz" | "results">("quiz");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [sortBy, setSortBy] = useState<"compatibility" | "distance" | "major">("compatibility");
  const [selectedRoommate, setSelectedRoommate] = useState<any>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  const [chatRecipient, setChatRecipient] = useState<{ name: string; role: string; match?: number } | null>(null);

  const questions = [
    {
      id: 1,
      question: "Lịch ngủ lý tưởng của bạn?",
      icon: Moon,
      options: [
        { label: "Ngủ sớm (trước 10 giờ tối)", value: "early" },
        { label: "Ngủ muộn (sau nửa đêm)", value: "late" },
        { label: "Linh hoạt", value: "flexible" },
      ],
    },
    {
      id: 2,
      question: "Bạn có khách đến thăm thường xuyên không?",
      icon: Users,
      options: [
        { label: "Hiếm khi", value: "rarely" },
        { label: "Thỉnh thoảng", value: "sometimes" },
        { label: "Thường xuyên", value: "frequently" },
      ],
    },
    {
      id: 3,
      question: "Bạn thích môi trường như thế nào?",
      icon: Music,
      options: [
        { label: "Yên tĩnh", value: "quiet" },
        { label: "Ồn vừa phải được", value: "moderate" },
        { label: "Không ngại ồn", value: "noisy" },
      ],
    },
    {
      id: 4,
      question: "Bạn thường làm gì vào cuối tuần?",
      icon: Coffee,
      options: [
        { label: "Thư giãn tại nhà", value: "home" },
        { label: "Đi chơi bên ngoài", value: "out" },
        { label: "Kết hợp cả hai", value: "mix" },
      ],
    },
    {
      id: 5,
      question: "Phong cách sống của bạn?",
      icon: CheckCircle,
      options: [
        { label: "Rất ngăn nắp", value: "organized" },
        { label: "Vừa phải", value: "moderate" },
        { label: "Thoải mái", value: "relaxed" },
      ],
    },
  ];

  const matches = [
    {
      name: "Minh Tuấn",
      age: 23,
      university: "ĐH Bách Khoa TP.HCM",
      major: "Khoa học máy tính",
      school: "KHMT, ĐH Bách Khoa",
      match: 92,
      distance: "0.5 km",
      personalityTags: ["Ngủ sớm", "Hướng nội"],
      lifestyleTags: ["Ngăn nắp", "Yên tĩnh"],
      hobbyTags: ["Tập gym", "Nấu ăn", "Leo núi"],
      bio: "Sinh viên cao học CNTT, thích code, leo núi và nấu ăn. Tìm bạn cùng phòng yên tĩnh để học tập!",
    },
    {
      name: "Hương Giang",
      age: 22,
      university: "ĐH Kinh tế TP.HCM",
      major: "Quản trị kinh doanh",
      school: "Kinh tế, ĐH Kinh tế",
      match: 88,
      distance: "2 km",
      personalityTags: ["Linh hoạt", "Hướng ngoại"],
      lifestyleTags: ["Hòa đồng", "Sạch sẽ"],
      hobbyTags: ["Ẩm thực", "Khám phá"],
      bio: "Sinh viên kinh tế, mê cà phê, thích khám phá. Cùng tìm những quán ăn ngon nhé!",
    },
    {
      name: "Đức Anh",
      age: 24,
      university: "ĐH Quốc Gia",
      major: "Kỹ thuật",
      school: "Kỹ thuật, ĐHQG",
      match: 85,
      distance: "1.3 km",
      personalityTags: ["Ngủ muộn", "Sáng tạo"],
      lifestyleTags: ["Vừa phải", "Năng động"],
      hobbyTags: ["Mê nhạc", "Game", "Concert"],
      bio: "Sinh viên kỹ thuật kiêm nhạc sĩ bán thời gian. Luôn sẵn sàng chơi game cùng!",
    },
    {
      name: "Thanh Tâm",
      age: 21,
      university: "ĐH Khoa học Xã hội",
      major: "Tâm lý học",
      school: "Tâm lý, ĐHKHXH",
      match: 82,
      distance: "3.5 km",
      personalityTags: ["Ngủ sớm", "Chu đáo"],
      lifestyleTags: ["Yên tĩnh", "Tối giản"],
      hobbyTags: ["Đọc sách", "Yoga", "Thiền"],
      bio: "Sinh viên tâm lý học, yêu đọc sách, yoga và trò chuyện sâu.",
    },
  ];

  const sortedMatches = [...matches].sort((a, b) => {
    if (sortBy === "compatibility") return b.match - a.match;
    if (sortBy === "distance") return parseFloat(a.distance) - parseFloat(b.distance);
    if (sortBy === "major") return a.major.localeCompare(b.major);
    return 0;
  });

  const handleInviteToChat = (match: any) => {
    setChatRecipient({ name: match.name, role: match.school, match: match.match });
    setIsChatDrawerOpen(true);
    toast.success("Đã gửi lời mời cho " + match.name + "!");
  };

  const handleViewProfile = (match: any) => {
    setSelectedRoommate(match);
    setIsProfileModalOpen(true);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setCurrentStep("results");
    }
  };

  const QuizView = () => {
    const question = questions[currentQuestion];
    const Icon = question.icon;

    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Progress value={((currentQuestion + 1) / questions.length) * 100} className="mb-2" />
          <p className="text-sm text-gray-600 text-center">
            Câu hỏi {currentQuestion + 1} / {questions.length}
          </p>
        </div>

        <Card className="p-8 rounded-3xl shadow-lg border-0">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Icon className="w-8 h-8 text-primary" />
          </div>

          <h2 className="text-center mb-8">{question.question}</h2>

          <div className="space-y-3">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={handleNext}
                className="w-full p-4 rounded-2xl border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all text-left"
              >
                {option.label}
              </button>
            ))}
          </div>
        </Card>

        <div className="flex gap-3 mt-6">
          {currentQuestion > 0 && (
            <Button
              variant="outline"
              onClick={() => setCurrentQuestion(currentQuestion - 1)}
              className="rounded-full"
            >
              Quay lại
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => setCurrentStep("results")}
            className="ml-auto rounded-full"
          >
            Bỏ qua
          </Button>
        </div>
      </div>
    );
  };

  const ResultsView = () => (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <h1 className="mb-2">Kết quả phù hợp</h1>
        <p className="text-gray-600">
          Chúng tôi tìm thấy {matches.length} bạn cùng phòng phù hợp dựa trên sở thích của bạn
        </p>
      </div>

      {/* Sort Dropdown */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-600">
          Hiển thị {sortedMatches.length} kết quả
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Sắp xếp:</span>
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-[180px] rounded-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="compatibility">Độ phù hợp</SelectItem>
              <SelectItem value="distance">Khoảng cách</SelectItem>
              <SelectItem value="major">Ngành học</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        <div className="grid md:grid-cols-2 gap-6">
          {sortedMatches.map((match, index) => (
            <motion.div
              key={match.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ 
                duration: 0.3,
                ease: "easeOut",
                delay: index * 0.05 
              }}
            >
            <Card className="p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-start gap-4 mb-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="text-lg bg-gradient-to-br from-primary/20 to-secondary/20">
                    {match.name.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <h3 className="mb-0">{match.name}, {match.age}</h3>
                      <p className="text-sm text-gray-600">{match.school}</p>
                    </div>
                    <Badge className="bg-gradient-to-r from-secondary to-primary text-white px-3 py-1 shadow-md">
                      {match.match}%
                    </Badge>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-4">{match.bio}</p>

              {/* Colored Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {match.personalityTags.map((tag, i) => (
                  <Badge
                    key={i}
                    className="bg-[#E6F0FF] text-[#1557FF] hover:bg-[#E6F0FF] border-0"
                    style={{ borderRadius: "20px", padding: "6px 12px" }}
                  >
                    {tag}
                  </Badge>
                ))}
                {match.lifestyleTags.map((tag, i) => (
                  <Badge
                    key={i}
                    className="bg-[#EFE6FF] text-[#7B61FF] hover:bg-[#EFE6FF] border-0"
                    style={{ borderRadius: "20px", padding: "6px 12px" }}
                  >
                    {tag}
                  </Badge>
                ))}
                {match.hobbyTags.map((tag, i) => (
                  <Badge
                    key={i}
                    className="bg-[#E6FFF0] text-[#23A35A] hover:bg-[#E6FFF0] border-0"
                    style={{ borderRadius: "20px", padding: "6px 12px" }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleInviteToChat(match)}
                  className="flex-1 bg-primary hover:bg-primary/90 rounded-full transition-colors duration-200"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Invite to Chat
                </Button>
                <Button
                  onClick={() => handleViewProfile(match)}
                  variant="outline"
                  className="rounded-full transition-colors duration-200"
                >
                  View Profile
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
        </div>
      </AnimatePresence>

      <div className="mt-8 text-center">
        <Button
          variant="outline"
          onClick={() => {
            setCurrentStep("quiz");
            setCurrentQuestion(0);
          }}
          className="rounded-full"
        >
          Retake Quiz
        </Button>
      </div>

      {/* Modals */}
      {selectedRoommate && (
        <RoommateProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          onMessageClick={() => {
            setIsProfileModalOpen(false);
            handleInviteToChat(selectedRoommate);
          }}
          roommate={{
            name: selectedRoommate.name,
            role: selectedRoommate.school,
            match: selectedRoommate.match,
            age: selectedRoommate.age,
            university: selectedRoommate.university,
            major: selectedRoommate.major,
            bio: selectedRoommate.bio,
          }}
        />
      )}

      {chatRecipient && (
        <ChatDrawer
          isOpen={isChatDrawerOpen}
          onClose={() => setIsChatDrawerOpen(false)}
          recipientName={chatRecipient.name}
          recipientRole={chatRecipient.role}
          compatibilityScore={chatRecipient.match}
        />
      )}
    </div>
  );

  return (
    <div className="pb-20 md:pb-8 min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-border z-40 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h3 className="ml-3">Compatibility Match</h3>
        </div>
      </div>

      {currentStep === "quiz" ? <QuizView /> : <ResultsView />}
    </div>
  );
}
