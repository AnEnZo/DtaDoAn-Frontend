'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { FaGoogle } from 'react-icons/fa';
import { Button } from 'antd';
import { useAuth } from '@/lib/hooks/useAuth';
import { API_URL } from '@/lib/api/client';
import { useAuthStore } from '@/lib/store/auth-store';

interface LoginFormData {
  username: string;
  password: string;
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const router = useRouter();
  const { login } = useAuth();
  const { login: storeLogin, getRedirectPath } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<LoginFormData>({
    mode: 'onChange',
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const handleLoginSuccess = (token: string) => {
    // Update both hooks and store
    login(token);
    storeLogin(token);

    setMessage('Đăng nhập thành công!');
    reset();

    // Smart redirect based on role
    const redirectPath = getRedirectPath();
    setTimeout(() => router.push(redirectPath), 800);
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setMessage('');
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Đăng nhập thất bại');
      const responseData = await res.json();

      handleLoginSuccess(responseData.token);
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const oauthLogin = () => {
    const redirectUri = `${window.location.origin}/oauth2-redirect`;
    document.cookie = `redirect_uri=${redirectUri}; path=/`;
    window.location.href = `${API_URL}/oauth2/authorization/google`;
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background: 'linear-gradient(135deg, #D2691E 0%, #CD853F 50%, #DEB887 100%)',
      }}
    >
      {/* Main Login Card - Compact */}
      <div className="w-full max-w-md mx-auto" style={{ maxWidth: '420px' }}>
        <div
          className="rounded-3xl shadow-2xl p-10"
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
            padding: '2.5rem',
          }}
        >
          {/* Brand Logo */}
          <div className="text-center mb-6">
            <Image
              src="/assets/logoTheCoffeHouse.png"
              alt="The Coffee House"
              width={220}
              height={100}
              style={{ margin: '0 auto', display: 'block' }}
              priority
            />
          </div>

          {/* Form Container */}
          <div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Username Field */}
              <div>
                <label htmlFor="username" className="block text-gray-700 text-sm font-medium mb-2">
                  Tên đăng nhập hoặc Email
                </label>
                <input
                  id="username"
                  type="text"
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 text-gray-800 ${errors.username
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:border-orange-500 focus:ring-orange-200'
                    }`}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '12px',
                    color: '#1f2937',
                    backgroundColor: '#ffffff',
                  }}
                  placeholder="Nhập tên đăng nhập hoặc email"
                  {...register('username', {
                    required: 'Vui lòng nhập tên đăng nhập hoặc email',
                    minLength: {
                      value: 3,
                      message: 'Tên đăng nhập phải có ít nhất 3 ký tự',
                    },
                  })}
                />
                {errors.username && (
                  <p className="mt-1 text-xs text-red-600">{errors.username.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-2">
                  Mật khẩu
                </label>
                <input
                  id="password"
                  type="password"
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 text-gray-800 ${errors.password
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:border-orange-500 focus:ring-orange-200'
                    }`}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '12px',
                    color: '#1f2937',
                    backgroundColor: '#ffffff',
                  }}
                  placeholder="Nhập mật khẩu"
                  {...register('password', {
                    required: 'Vui lòng nhập mật khẩu',
                    minLength: {
                      value: 6,
                      message: 'Mật khẩu phải có ít nhất 6 ký tự',
                    },
                  })}
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
                )}
              </div>

              {/* Message Display */}
              {message && (
                <div
                  className={`text-center p-3 rounded-lg text-sm ${message.includes('thành công')
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                    }`}
                >
                  {message}
                </div>
              )}

              {/* Login Button */}
              <button
                type="submit"
                className="w-full text-white font-bold py-3 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                style={{
                  background: 'linear-gradient(to right, #f97316, #ea580c)',
                  border: 'none',
                  padding: '0.75rem 1rem',
                  fontFamily: 'inherit',
                  borderRadius: '12px',
                  boxShadow: '0 10px 20px rgba(234, 88, 12, 0.35)',
                  marginTop: '12px',
                }}
                disabled={isLoading || !isValid}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Đang đăng nhập...
                  </div>
                ) : (
                  'Đăng nhập'
                )}
              </button>
            </form>

            {/* Links */}
            <div className="mt-5 text-center space-y-2">
              <Link
                href="/forgot-password-email"
                className="block text-orange-600 hover:text-orange-700 text-sm hover:underline transition-colors"
              >
                Quên mật khẩu?
              </Link>
              <div className="text-gray-600 text-sm">
                Chưa có tài khoản?{' '}
                <Link
                  href="/register"
                  className="text-orange-600 hover:text-orange-700 font-semibold hover:underline transition-colors"
                >
                  Đăng ký ngay
                </Link>
              </div>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-white text-gray-500 text-sm">hoặc</span>
              </div>
            </div>

            {/* Google Login */}
            <Button
              type="default"
              block
              size="large"
              icon={<FaGoogle className="text-red-500" />}
              style={{
                backgroundColor: '#cc8636ff',
                border: '1px solid #d1d5db',
                borderRadius: 12,
                boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
              }}
              onClick={oauthLogin}
            >
              Đăng nhập với Google
            </Button>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-gray-200 text-center">
              <p className="text-gray-500 text-xs">© 2026 Cafe Management System</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
