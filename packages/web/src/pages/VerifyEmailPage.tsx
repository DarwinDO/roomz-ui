import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mail, CheckCircle, AlertCircle, RefreshCw, Home } from 'lucide-react';
import { useAuth } from '@/contexts';
import { supabase } from '@/lib/supabase';

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [countdown, setCountdown] = useState(0);

  // Check if user is already verified
  useEffect(() => {
    const checkEmailVerified = async () => {
      if (user) {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser?.email_confirmed_at) {
          // Email đã được xác nhận
          navigate('/search', { replace: true });
        }
      }
    };

    checkEmailVerified();

    // Listen for real-time verification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
          navigate('/search', { replace: true });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [user, navigate]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendEmail = async () => {
    if (!user?.email) return;

    setLoading(true);
    setResendStatus('sending');

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });

      if (error) throw error;

      setResendStatus('success');
      setCountdown(60); // 60 seconds cooldown
    } catch (error: unknown) {
      console.error('Resend error:', error);
      setResendStatus('error');
    } finally {
      setLoading(false);
      setTimeout(() => setResendStatus('idle'), 3000);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <div lang="vi" className="min-h-screen bg-gradient-to-br from-primary/10 via-white to-secondary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 rounded-3xl shadow-2xl border-0 bg-white">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Xác nhận email của bạn</h1>
          <p className="text-gray-600">
            Chúng tôi đã gửi link xác nhận đến
          </p>
          <p className="font-semibold text-primary mt-1">{user?.email}</p>
        </div>

        {/* Instructions */}
        <div className="space-y-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Vui lòng kiểm tra hộp thư của bạn</p>
                <ul className="space-y-1 list-disc list-inside text-blue-800">
                  <li>Mở email từ RommZ</li>
                  <li>Nhấp vào link xác nhận</li>
                  <li>Bạn sẽ được tự động chuyển hướng về trang chủ</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
              <div className="text-sm text-yellow-900">
                <p className="font-medium mb-1">Không tìm thấy email?</p>
                <ul className="space-y-1 list-disc list-inside text-yellow-800">
                  <li>Kiểm tra thư mục Spam hoặc Junk</li>
                  <li>Đảm bảo email đúng: {user?.email}</li>
                  <li>Đợi vài phút và kiểm tra lại</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {resendStatus === 'success' && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span className="text-sm">Email xác nhận đã được gửi lại thành công!</span>
          </div>
        )}

        {resendStatus === 'error' && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="text-sm">Không thể gửi lại email. Vui lòng thử lại sau.</span>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={handleResendEmail}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.currentTarget.blur();
              }
            }}
            disabled={loading || countdown > 0}
            className="w-full h-12 bg-primary hover:bg-primary/90 rounded-full"
            variant="default"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Đang gửi...
              </>
            ) : countdown > 0 ? (
              `Gửi lại sau ${countdown}s`
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Gửi lại email xác nhận
              </>
            )}
          </Button>

          <Button
            onClick={handleBackToLogin}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                handleBackToLogin();
              }
            }}
            variant="outline"
            className="w-full h-12 rounded-full"
          >
            <Home className="w-4 h-4 mr-2" />
            Quay lại đăng nhập
          </Button>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-center text-sm text-gray-500">
            Cần trợ giúp?{' '}
            <a href="#" className="text-primary hover:underline">
              Liên hệ hỗ trợ
            </a>
          </p>
        </div>
      </Card>
    </div>
  );
}
