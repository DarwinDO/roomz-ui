import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  ShieldCheck,
  Camera,
  FileText,
  CheckCircle,
  Upload,
  User,
} from "lucide-react";
import { Upload360Modal } from "@/components/modals/Upload360Modal";
import { VerifyLandlordModal } from "@/components/modals/VerifyLandlordModal";
import { toast } from "sonner";

export default function VerificationPage() {
  const navigate = useNavigate();
  const onBack = () => navigate(-1);
  
  const [isUpload360Open, setIsUpload360Open] = useState(false);
  const [isVerifyLandlordOpen, setIsVerifyLandlordOpen] = useState(false);
  const [completedSteps, setCompletedSteps] = useState({
    id: true,
    photo: false,
    landlord: false,
  });
  const handlePhotoComplete = () => {
    setCompletedSteps({ ...completedSteps, photo: true });
    toast.success("Đã tải ảnh 360° thành công!");
  };

  const handleLandlordComplete = () => {
    setCompletedSteps({ ...completedSteps, landlord: true });
    toast.success("Đã gửi thông tin chủ nhà để xác minh!");
  };

  const getStepStatus = (stepId: string) => {
    if (completedSteps[stepId as keyof typeof completedSteps]) return "completed";
    if (stepId === "photo" && !completedSteps.photo) return "in-progress";
    if (stepId === "landlord" && completedSteps.photo && !completedSteps.landlord) return "in-progress";
    return "pending";
  };

  const calculateProgress = () => {
    const total = Object.keys(completedSteps).length;
    const completed = Object.values(completedSteps).filter(Boolean).length;
    return Math.round((completed / total) * 100);
  };

  const verificationSteps = [
    {
      id: "id",
      title: "Xác thực giấy tờ",
      description: "Tải lên CCCD/CMND hoặc hộ chiếu",
      icon: FileText,
      status: getStepStatus("id"),
    },
    {
      id: "photo",
      title: "Ảnh phòng 360°",
      description: "Chụp đầy đủ các góc phòng của bạn",
      icon: Camera,
      status: getStepStatus("photo"),
    },
    {
      id: "landlord",
      title: "Thông tin chủ nhà",
      description: "Xác minh quyền sở hữu/chủ cho thuê",
      icon: User,
      status: getStepStatus("landlord"),
    },
  ];

  const benefits = [
    "Được ưu tiên hiển thị khi người khác tìm kiếm",
    "Tăng độ tin cậy với người thuê/bạn cùng phòng",
    "Xác nhận đặt phòng nhanh hơn",
    "Kích hoạt bộ lọc chỉ hiện tin Verified+",
    "Nhận badge nổi bật trên hồ sơ cá nhân",
  ];

  return (
    <div className="pb-20 md:pb-8 min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-border z-40 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h3 className="ml-3">Chứng nhận Verified+</h3>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero Card */}
        <Card className="p-8 rounded-3xl bg-white mb-8 text-center border-0 shadow-lg">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <h1 className="mb-3">Nhận huy hiệu Verified+</h1>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Tạo ấn tượng chuyên nghiệp và tăng độ tin cậy với hồ sơ đã xác thực. Người dùng Verified+
            nhận được nhiều phản hồi hơn gấp 3 lần và đặt phòng nhanh hơn 50%.
          </p>
          <Badge className="bg-primary text-white px-4 py-2 text-base">
            Miễn phí cho sinh viên • 99k/tháng cho người dùng khác
          </Badge>
        </Card>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3>Tiến độ xác thực</h3>
            <span className="text-sm text-gray-600">{calculateProgress()}% hoàn thành</span>
          </div>
          <Progress value={calculateProgress()} className="h-3" />
        </div>

        {/* Verification Steps */}
        <div className="space-y-4 mb-8">
          {verificationSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card
                key={step.id}
                className={`p-6 rounded-2xl transition-all ${
                  step.status === "in-progress"
                    ? "border-2 border-primary shadow-md"
                    : "border"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      step.status === "completed"
                        ? "bg-green-100"
                        : step.status === "in-progress"
                        ? "bg-primary/10"
                        : "bg-gray-100"
                    }`}
                  >
                    {step.status === "completed" ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <Icon
                        className={`w-6 h-6 ${
                          step.status === "in-progress"
                            ? "text-primary"
                            : "text-gray-400"
                        }`}
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg">{step.title}</h3>
                      {step.status === "completed" && (
                        <Badge className="bg-green-100 text-green-700 border-0">
                          Hoàn tất
                        </Badge>
                      )}
                      {step.status === "in-progress" && (
                        <Badge className="bg-primary/10 text-primary border-0">
                          Đang thực hiện
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{step.description}</p>
                    {step.status !== "completed" && (
                      <Button
                        onClick={() => {
                          if (step.id === "photo") setIsUpload360Open(true);
                          if (step.id === "landlord") setIsVerifyLandlordOpen(true);
                        }}
                        className={`rounded-full ${
                          step.status === "in-progress"
                            ? "bg-primary hover:bg-primary/90"
                            : ""
                        }`}
                        variant={step.status === "in-progress" ? "default" : "outline"}
                        size="sm"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {step.status === "in-progress" ? "Tiếp tục" : "Bắt đầu"}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Benefits */}
        <Card className="p-8 rounded-3xl bg-gradient-to-br from-secondary/10 to-primary/10 border-0">
          <h3 className="mb-6 text-center">Quyền lợi khi Verified+</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">{benefit}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* CTA */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 mb-4">
            Có thắc mắc về quy trình xác thực? Xem{" "}
            <span className="text-primary cursor-pointer underline">Trung tâm trợ giúp</span>
          </p>
        </div>
      </div>

      {/* Modals */}
      <Upload360Modal
        isOpen={isUpload360Open}
        onClose={() => setIsUpload360Open(false)}
        onComplete={handlePhotoComplete}
      />
      <VerifyLandlordModal
        isOpen={isVerifyLandlordOpen}
        onClose={() => setIsVerifyLandlordOpen(false)}
        onComplete={handleLandlordComplete}
      />
    </div>
  );
}
