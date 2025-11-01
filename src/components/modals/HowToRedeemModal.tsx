import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QrCode, MapPin, Gift, CreditCard, CheckCircle2, AlertCircle } from "lucide-react";

interface HowToRedeemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HowToRedeemModal({ isOpen, onClose }: HowToRedeemModalProps) {
  const steps = [
    {
      number: 1,
      title: "Tìm ưu đãi phù hợp",
      description: "Duyệt qua danh sách các ưu đãi gần bạn trên trang RoomZ Local Passport",
      icon: MapPin,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-100",
      tips: [
        "Sử dụng bộ lọc danh mục để tìm nhanh",
        "Kiểm tra khoảng cách từ nơi bạn ở",
        "Xem chi tiết ưu đãi trước khi sử dụng",
      ],
    },
    {
      number: 2,
      title: "Nhận mã QR",
      description: "Nhấp vào nút 'Nhận voucher' để tạo mã QR cá nhân của bạn",
      icon: QrCode,
      iconColor: "text-purple-600",
      iconBg: "bg-purple-100",
      tips: [
        "Mỗi mã QR có thời hạn sử dụng",
        "Có thể tạo nhiều mã cho các cửa hàng khác nhau",
        "Lưu ảnh màn hình để sử dụng offline",
      ],
    },
    {
      number: 3,
      title: "Xuất trình tại cửa hàng",
      description: "Đến cửa hàng và cho nhân viên quét mã QR khi thanh toán",
      icon: Gift,
      iconColor: "text-green-600",
      iconBg: "bg-green-100",
      tips: [
        "Xuất trình mã trước khi thanh toán",
        "Có thể cần xuất trình thẻ sinh viên",
        "Ưu đãi được áp dụng tự động vào hóa đơn",
      ],
    },
    {
      number: 4,
      title: "Thanh toán và tận hưởng",
      description: "Hoàn tất thanh toán với giá đã giảm và tận hưởng dịch vụ",
      icon: CreditCard,
      iconColor: "text-orange-600",
      iconBg: "bg-orange-100",
      tips: [
        "Giữ hóa đơn để kiểm tra sau",
        "Đánh giá trải nghiệm để giúp cộng đồng",
        "Quay lại sử dụng ưu đãi khi cần",
      ],
    },
  ];

  const faqs = [
    {
      question: "Tôi có thể sử dụng ưu đãi bao nhiêu lần?",
      answer: "Phụ thuộc vào từng đối tác. Một số ưu đãi dùng được nhiều lần, một số chỉ cho lần đầu.",
    },
    {
      question: "Điều gì xảy ra nếu mã QR không hoạt động?",
      answer: "Hãy liên hệ nhân viên cửa hàng hoặc hỗ trợ RoomZ qua app để được giúp đỡ ngay.",
    },
    {
      question: "Tôi có cần thẻ sinh viên không?",
      answer: "Có, một số đối tác có thể yêu cầu xuất trình thẻ sinh viên để xác minh.",
    },
    {
      question: "Ưu đãi có thể kết hợp với khuyến mãi khác?",
      answer: "Thường thì không, trừ khi cửa hàng cho phép. Hãy hỏi nhân viên để chắc chắn.",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-6 h-6 text-primary" />
            Cách sử dụng ưu đãi RoomZ Passport
          </DialogTitle>
          <DialogDescription>
            Hướng dẫn chi tiết từng bước để tận dụng tối đa các ưu đãi dành cho sinh viên
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Steps */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Quy trình 4 bước đơn giản</h4>
            {steps.map((step, idx) => (
              <Card
                key={idx}
                className="p-5 rounded-2xl border-border hover:shadow-md transition-all"
              >
                <div className="flex gap-4">
                  {/* Step Number & Icon */}
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {step.number}
                    </div>
                    <div className={`w-10 h-10 ${step.iconBg} rounded-full flex items-center justify-center`}>
                      <step.icon className={`w-5 h-5 ${step.iconColor}`} />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-2">
                    <h4>{step.title}</h4>
                    <p className="text-sm text-gray-600">{step.description}</p>
                    
                    {/* Tips */}
                    <div className="space-y-1 pt-2">
                      {step.tips.map((tip, tipIdx) => (
                        <div key={tipIdx} className="flex items-start gap-2 text-xs text-gray-600">
                          <CheckCircle2 className="w-3.5 h-3.5 text-secondary shrink-0 mt-0.5" />
                          <span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Visual Example */}
          <Card className="p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
            <h4 className="mb-4 text-center">Ví dụ minh họa</h4>
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div className="space-y-2">
                <div className="w-16 h-16 bg-white rounded-2xl mx-auto flex items-center justify-center border-2 border-primary/20">
                  <MapPin className="w-8 h-8 text-primary" />
                </div>
                <p className="text-sm font-medium">Tìm quán cà phê gần</p>
                <p className="text-xs text-gray-600">Café 89° - Giảm 20%</p>
              </div>
              <div className="space-y-2">
                <div className="w-16 h-16 bg-white rounded-2xl mx-auto flex items-center justify-center border-2 border-primary/20">
                  <QrCode className="w-8 h-8 text-primary" />
                </div>
                <p className="text-sm font-medium">Tạo mã QR</p>
                <p className="text-xs text-gray-600">Nhấn "Nhận voucher"</p>
              </div>
              <div className="space-y-2">
                <div className="w-16 h-16 bg-white rounded-2xl mx-auto flex items-center justify-center border-2 border-primary/20">
                  <Gift className="w-8 h-8 text-primary" />
                </div>
                <p className="text-sm font-medium">Tiết kiệm 15k</p>
                <p className="text-xs text-gray-600">Trên hóa đơn 75k</p>
              </div>
            </div>
          </Card>

          {/* FAQs */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Câu hỏi thường gặp</h4>
            <div className="space-y-2">
              {faqs.map((faq, idx) => (
                <Card key={idx} className="p-4 rounded-xl border-border">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{faq.question}</p>
                      <p className="text-xs text-gray-600">{faq.answer}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Important Note */}
          <Card className="p-4 rounded-xl bg-yellow-50 border-yellow-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center shrink-0">
                ⚠️
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-yellow-900">Lưu ý quan trọng</p>
                <ul className="text-xs text-yellow-800 space-y-1 list-disc list-inside">
                  <li>Mỗi mã QR chỉ sử dụng được một lần cho mỗi giao dịch</li>
                  <li>Không chia sẻ hoặc chuyển nhượng mã cho người khác</li>
                  <li>Kiểm tra điều khoản sử dụng của từng đối tác</li>
                  <li>Một số ưu đãi có giới hạn số lượng hoặc thời gian</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Support CTA */}
          <Card className="p-5 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
            <div className="text-center space-y-2">
              <p className="text-sm font-medium">Cần hỗ trợ thêm?</p>
              <p className="text-xs text-gray-600">
                Liên hệ đội ngũ RoomZ qua chat trong app hoặc email support@roomz.vn
              </p>
            </div>
          </Card>

          {/* Close Button */}
          <Button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 rounded-full h-12 text-white"
          >
            Đã hiểu, bắt đầu sử dụng ngay!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

