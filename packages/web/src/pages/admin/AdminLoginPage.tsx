/**
 * Admin Login Page
 * Uses real Supabase auth with role-based access control
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import RommzIcon from "@/assets/logo/rommz-icon.png";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();

  // Auto-redirect if already logged in as admin
  useEffect(() => {
    if (!authLoading && user && profile?.role === "admin") {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [user, profile, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Sign in with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Không nhận được thông tin người dùng");

      // Check if user is admin
      const { data: userProfile, error: profileError } = await supabase
        .from("users")
        .select("role")
        .eq("id", authData.user.id)
        .single();

      if (profileError) throw new Error("Không thể xác thực quyền truy cập");

      if (userProfile?.role !== "admin") {
        // Not an admin - sign out and show error
        await supabase.auth.signOut();
        throw new Error("Bạn không có quyền truy cập trang quản trị");
      }

      // Success - admin user logged in
      toast.success("Đăng nhập thành công!");
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Đăng nhập thất bại";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-white to-secondary/10">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-white to-secondary/10 px-4">
      <Card className="w-full max-w-md p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-card rounded-2xl flex items-center justify-center mb-4 border border-border">
            <img src={RommzIcon} alt="rommz" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">rommz Admin</h1>
          <p className="text-gray-600 text-sm mt-2">Đăng nhập vào hệ thống quản trị</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@roomz.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-12"
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Đang đăng nhập...
              </>
            ) : (
              "Đăng nhập Admin"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Chỉ dành cho quản trị viên
          </p>
          <Button
            variant="link"
            className="text-xs text-primary mt-2"
            onClick={() => navigate("/login")}
          >
            Quay lại trang đăng nhập chung
          </Button>
        </div>
      </Card>
    </div>
  );
}
