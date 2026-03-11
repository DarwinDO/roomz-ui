/**
 * Auth callback page for OAuth and legacy email flows.
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';

const PUBLIC_AUTH_REDIRECT_KEY = 'rommz_public_auth_redirect';
const LANDLORD_ONLY_PATHS = ['/landlord', '/post-room'];

type CallbackStatus = 'processing' | 'success' | 'error';
type UserRole = 'admin' | 'landlord' | 'student' | 'renter' | null;

function isLandlordPath(pathname: string) {
  return LANDLORD_ONLY_PATHS.some((path) => pathname.startsWith(path));
}

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<CallbackStatus>('processing');
  const [message, setMessage] = useState('Đang xử lý xác thực...');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const clearStoredRedirect = () => {
      localStorage.removeItem(PUBLIC_AUTH_REDIRECT_KEY);
    };

    const getStoredRedirect = () => {
      const savedPath = localStorage.getItem(PUBLIC_AUTH_REDIRECT_KEY) || '/search';
      clearStoredRedirect();
      return savedPath;
    };

    const getRole = async (userId: string): Promise<UserRole> => {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return (data?.role as UserRole) ?? null;
    };

    const finishOAuthLogin = async (userId: string) => {
      const role = await getRole(userId);
      if (role === 'admin') {
        await supabase.auth.signOut();
        setStatus('error');
        setErrorMessage('Tài khoản quản trị vui lòng đăng nhập tại trang admin.');
        setTimeout(() => navigate('/admin/login', { replace: true }), 1500);
        return;
      }

      const nextPath = getStoredRedirect();
      const targetPath = role === 'landlord' || !isLandlordPath(nextPath) ? nextPath : '/search';
      setStatus('success');
      setMessage('Đăng nhập thành công! Đang chuyển hướng...');
      setTimeout(() => navigate(targetPath, { replace: true }), 1200);
    };

    const handleCallback = async () => {
      try {
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        if (error) {
          clearStoredRedirect();
          setStatus('error');
          setErrorMessage(errorDescription || 'Đã xảy ra lỗi trong quá trình xác thực');
          return;
        }

        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const type = hashParams.get('type');

        await new Promise((resolve) => setTimeout(resolve, 500));

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError) {
          throw sessionError;
        }

        if (!session?.user) {
          clearStoredRedirect();
          setStatus('error');
          setErrorMessage('Không thể xác thực. Vui lòng thử đăng nhập lại.');
          return;
        }

        if (type === 'recovery') {
          clearStoredRedirect();
          setStatus('success');
          setMessage('Xác thực thành công! Đang chuyển hướng...');
          setTimeout(() => navigate('/reset-password', { replace: true }), 1200);
          return;
        }

        if (type === 'signup' || type === 'email_change') {
          clearStoredRedirect();
          setStatus('success');
          setMessage('Email đã được xác nhận! Đang chuyển hướng...');
          setTimeout(() => navigate('/search', { replace: true }), 1200);
          return;
        }

        await finishOAuthLogin(session.user.id);
      } catch (error) {
        console.error('Auth callback error:', error);
        clearStoredRedirect();
        const nextMessage = error instanceof Error ? error.message : 'Đã xảy ra lỗi trong quá trình xác thực';
        setStatus('error');
        setErrorMessage(nextMessage);
      }
    };

    void handleCallback();
  }, [navigate, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-white to-secondary/10 p-4">
      <Card className="w-full max-w-md rounded-3xl border-0 bg-white p-8 text-center shadow-2xl">
        {status === 'processing' && (
          <>
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <h1 className="mb-2 text-2xl font-bold">{message}</h1>
            <p className="text-gray-600">Vui lòng đợi trong giây lát...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-green-700">{message}</h1>
            <p className="text-gray-600">Bạn sẽ được chuyển hướng tự động...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-red-700">Xác thực thất bại</h1>
            <p className="mb-6 text-gray-600">{errorMessage}</p>
            <Button onClick={() => navigate('/login', { replace: true })} className="h-12 w-full rounded-full bg-primary hover:bg-primary/90">
              Quay lại đăng nhập
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}