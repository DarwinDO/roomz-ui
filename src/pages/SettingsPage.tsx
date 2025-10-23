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
      title: "Account",
      items: [
        { icon: UserCheck, label: "Verification Status", hasArrow: true },
        { icon: Lock, label: "Privacy & Security", hasArrow: true },
        { icon: CreditCard, label: "Payment Methods", hasArrow: true },
      ],
    },
    {
      title: "Preferences",
      items: [
        { icon: Globe, label: "Language", value: "English", hasArrow: true },
        { icon: Bell, label: "Push Notifications", toggle: true, value: pushNotifications, onChange: setPushNotifications },
        { icon: Bell, label: "Email Notifications", toggle: true, value: emailNotifications, onChange: setEmailNotifications },
        { icon: Moon, label: "Dark Mode", toggle: true, value: darkMode, onChange: setDarkMode },
      ],
    },
    {
      title: "Support & Legal",
      items: [
        { icon: HelpCircle, label: "Help Center", hasArrow: true },
        { icon: Shield, label: "Safety Guidelines", hasArrow: true },
        { icon: FileText, label: "Terms of Service", hasArrow: true },
        { icon: FileText, label: "Privacy Policy", hasArrow: true },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 to-secondary/10 px-6 py-8 border-b">
        <div className="max-w-4xl mx-auto">
          <h1 className="mb-2">Settings</h1>
          <p className="text-gray-600">
            Manage your account preferences and app settings
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
              <h3 className="mb-1">John Doe</h3>
              <p className="text-sm text-gray-500">john.doe@example.com</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs">
                  Verified Student
                </div>
                <div className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-xs">
                  RoomZ+ Member
                </div>
              </div>
            </div>
            <Button variant="outline" className="rounded-full">
              Edit
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
                        if (!item.toggle) {
                          // Handle navigation
                        }
                      }}
                    >
                      <Icon className="w-5 h-5 text-gray-600" />
                      <span className="flex-1 text-left">{item.label}</span>
                      
                      {item.toggle ? (
                        <Switch
                          checked={item.value as boolean}
                          onCheckedChange={item.onChange}
                        />
                      ) : item.value ? (
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
            <p className="text-sm text-gray-500 mb-4">Version 2.1.0</p>
            <p className="text-xs text-gray-400">
              © 2025 RoomZ. All rights reserved.
            </p>
          </div>
        </Card>

        {/* Logout Button */}
        <Button
          variant="outline"
          className="w-full h-12 rounded-full text-red-600 border-red-200 hover:bg-red-50"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Log Out
        </Button>
      </div>
    </div>
  );
}
