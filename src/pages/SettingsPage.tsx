import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  ChevronRight,
  Bell,
  Lock,
  CreditCard,
  HelpCircle,
  FileText,
  LogOut,
  Moon,
  Globe,
  Shield,
  UserCheck,
} from "lucide-react";

export default function SettingsPage() {
  const navigate = useNavigate();
  const onBack = () => navigate(-1);
  
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const settingsSections = [
    {
      title: "Tài khoản",
      items: [
        { icon: UserCheck, label: "Trạng thái xác thực", hasArrow: true },
        { icon: Lock, label: "Quyền riêng tư & Bảo mật", hasArrow: true },
        { icon: CreditCard, label: "Phương thức thanh toán", hasArrow: true },
      ],
    },
    {
      title: "Tùy chỉnh",
      items: [
        { icon: Globe, label: "Ngôn ngữ", value: "Tiếng Việt", hasArrow: true },
        { icon: Bell, label: "Thông báo đẩy", toggle: true, value: pushNotifications, onChange: setPushNotifications },
        { icon: Bell, label: "Thông báo email", toggle: true, value: emailNotifications, onChange: setEmailNotifications },
        { icon: Moon, label: "Chế độ tối", toggle: true, value: darkMode, onChange: setDarkMode },
      ],
    },
    {
      title: "Hỗ trợ & Pháp lý",
      items: [
        { icon: HelpCircle, label: "Trung tâm trợ giúp", hasArrow: true },
        { icon: Shield, label: "Hướng dẫn an toàn", hasArrow: true },
        { icon: FileText, label: "Điều khoản dịch vụ", hasArrow: true },
        { icon: FileText, label: "Chính sách bảo mật", hasArrow: true },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 to-secondary/10 px-6 py-8 border-b">
        <div className="max-w-4xl mx-auto">
          <h1 className="mb-2">Cài đặt</h1>
          <p className="text-gray-600">
            Quản lý tùy chỉnh tài khoản và cài đặt ứng dụng
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Profile Summary Card */}
        <Card className="p-6 rounded-2xl mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center text-2xl">
              JD
            </div>
            <div className="flex-1">
              <h3 className="mb-1">Nguyễn Văn A</h3>
              <p className="text-sm text-gray-500">nguyenvana@example.com</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs">
                  Sinh viên đã xác thực
                </div>
                <div className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-xs">
                  Thành viên RoomZ+
                </div>
              </div>
            </div>
            <Button variant="outline" className="rounded-full">
              Chỉnh sửa
            </Button>
          </div>
        </Card>

        {/* Settings Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-6">
            <h3 className="mb-4 px-2">{section.title}</h3>
            <Card className="rounded-2xl overflow-hidden">
              {section.items.map((item, itemIndex) => {
                const Icon = item.icon;
                return (
                  <div key={itemIndex}>
                    <button
                      className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                      onClick={() => {
                        if (!('toggle' in item)) {
                          // Handle navigation
                        }
                      }}
                    >
                      <Icon className="w-5 h-5 text-gray-600" />
                      <span className="flex-1 text-left">{item.label}</span>
                      
                      {'toggle' in item && item.toggle ? (
                        <Switch
                          checked={item.value as boolean}
                          onCheckedChange={item.onChange}
                        />
                      ) : 'value' in item && item.value ? (
                        <span className="text-sm text-gray-500">{item.value}</span>
                      ) : null}
                      
                      {item.hasArrow && (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    {itemIndex < section.items.length - 1 && (
                      <Separator className="mx-4" />
                    )}
                  </div>
                );
              })}
            </Card>
          </div>
        ))}

        {/* App Information */}
        <Card className="p-6 rounded-2xl mb-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl text-white">R</span>
            </div>
            <h4 className="mb-1">RoomZ</h4>
            <p className="text-sm text-gray-500 mb-4">Phiên bản 2.1.0</p>
            <p className="text-xs text-gray-400">
              © 2025 RoomZ. Đã đăng ký bản quyền.
            </p>
          </div>
        </Card>

        {/* Logout Button */}
        <Button
          variant="outline"
          className="w-full h-12 rounded-full text-red-600 border-red-200 hover:bg-red-50"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Đăng xuất
        </Button>
      </div>
    </div>
  );
}
