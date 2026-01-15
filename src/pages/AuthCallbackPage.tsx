/**
 * Auth Callback Page
 * Handles OAuth redirects and email verification callbacks
 * 
 * This page processes authentication tokens from:
 * - Google OAuth sign-in
 * - Email verification links
 * - Password reset links
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type CallbackStatus = 'processing' | 'success' | 'error';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<CallbackStatus>('processing');
  const [message, setMessage] = useState('Đang xử lý xác thực...');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for error in URL params (e.g., expired link)
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        if (error) {
          setStatus('error');
          setErrorMessage(errorDescription || 'Đã xảy ra lỗi trong quá trình xác thực');
          return;
        }

        // Get the hash from the URL - Supabase returns tokens in hash
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        // If we have tokens in hash, let Supabase handle them
        // detectSessionInUrl: true in supabase config handles this automatically
        // But we need to wait for the session to be established
        
        // Wait a bit for Supabase to process the tokens
        await new Promise(resolve => setTimeout(resolve, 500));

        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (session) {
          // Check what type of callback this is
          if (type === 'recovery') {
            // Password recovery - redirect to password reset page
            setStatus('success');
            setMessage('Xác thực thành công! Đang chuyển hướng...');
            setTimeout(() => navigate('/reset-password', { replace: true }), 1500);
          } else if (type === 'signup' || type === 'email_change') {
            // Email verification or email change
            setStatus('success');
            setMessage('Email đã được xác nhận! Đang chuyển hướng...');
            setTimeout(() => navigate('/search', { replace: true }), 1500);
          } else {
            // General OAuth sign-in (Google, etc.)
            setStatus('success');
            setMessage('Đăng nhập thành công! Đang chuyển hướng...');
            setTimeout(() => navigate('/search', { replace: true }), 1500);
          }
        } else {
          // No session established - might need to try getting session again
          // or there was a problem with the tokens
          
          // Try one more time after a delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          
          if (retrySession) {
            setStatus('success');
            setMessage('Đăng nhập thành công! Đang chuyển hướng...');
            setTimeout(() => navigate('/search', { replace: true }), 1500);
          } else {
            // Still no session - redirect to login
            setStatus('error');
            setErrorMessage('Không thể xác thực. Vui lòng thử đăng nhập lại.');
          }
        }
      } catch (error: any) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setErrorMessage(error.message || 'Đã xảy ra lỗi trong quá trình xác thực');
      }
    };

    handleCallback();
  }, [navigate, searchParams]);

  const handleRetry = () => {
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-white to-secondary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 rounded-3xl shadow-2xl border-0 bg-white text-center">
        {status === 'processing' && (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <h1 className="text-2xl font-bold mb-2">{message}</h1>
            <p className="text-gray-600">Vui lòng đợi trong giây lát...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2 text-green-700">{message}</h1>
            <p className="text-gray-600">Bạn sẽ được chuyển hướng tự động...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2 text-red-700">Xác thực thất bại</h1>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            <Button
              onClick={handleRetry}
              className="w-full h-12 bg-primary hover:bg-primary/90 rounded-full"
            >
              Quay lại đăng nhập
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
