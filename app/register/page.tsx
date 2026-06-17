'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Check, Loader2 } from 'lucide-react';
import { apiPost } from '@/lib/api/http';
import { getErrorMessage } from '@/lib/api/errors';
import {
    registerSchema,
    RegisterFormData,
    mapApiErrorToFields,
} from './validationRules';

const HELPER_TEXTS: Record<keyof RegisterFormData, string> = {
    displayName: 'Tên hiển thị từ 3 đến 50 ký tự',
    username: 'Tên đăng nhập từ 3 đến 50 ký tự',
    email: 'Email hợp lệ (ví dụ: name@domain.com)',
    phoneNumber: 'Số điện thoại gồm đúng 10 chữ số',
    password: 'Mật khẩu từ 6 đến 100 ký tự',
};

export default function RegisterPage() {
    const [globalError, setGlobalError] = useState<string>('');
    const router = useRouter();

    const {
        register,
        handleSubmit,
        setError,
        setFocus,
        formState: { errors, touchedFields, isSubmitting },
    } = useForm<RegisterFormData>({
        mode: 'onBlur',
        resolver: zodResolver(registerSchema),
        defaultValues: {
            displayName: '',
            username: '',
            email: '',
            phoneNumber: '',
            password: '',
        },
    });

    const getFieldState = (name: keyof RegisterFormData) => {
        const isTouched = touchedFields[name];
        const error = errors[name];
        if (error) return 'error';
        if (isTouched) return 'success';
        return 'idle';
    };

    const renderFieldMessage = (name: keyof RegisterFormData) => {
        const state = getFieldState(name);
        if (state === 'error') {
            return (
                <p className="field-message field-message--error">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {errors[name]?.message}
                </p>
            );
        }
        if (state === 'success') {
            return (
                <p className="field-message field-message--success">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    Hợp lệ
                </p>
            );
        }
        return (
            <p className="field-message field-message--idle">
                {HELPER_TEXTS[name]}
            </p>
        );
    };

    const onSubmit = async (data: RegisterFormData) => {
        setGlobalError('');
        try {
            await apiPost('/api/auth/register', data, { auth: false });
            router.push('/');
        } catch (err: any) {
            const errorMsg = getErrorMessage(err, 'Lỗi kết nối đến máy chủ. Vui lòng kiểm tra mạng!');
            const unmappableError = mapApiErrorToFields(errorMsg, setError, setFocus);
            if (unmappableError) {
                setGlobalError(unmappableError);
            }
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center p-6"
            style={{
                background: 'linear-gradient(135deg, #D2691E 0%, #CD853F 50%, #DEB887 100%)',
            }}
        >
            <div className="w-full max-w-md mx-auto" style={{ maxWidth: '420px' }}>
                <div
                    className="rounded-3xl shadow-2xl p-10 bg-white"
                    style={{
                        borderRadius: '20px',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
                        padding: '2.5rem',
                    }}
                >
                    <div className="text-center mb-6">
                        <Image
                            src="/assets/logoTheCoffeHouse.png"
                            alt="The Coffee House"
                            width={220}
                            height={100}
                            style={{ margin: '0 auto', display: 'block' }}
                            priority
                        />

                        <p className="text-gray-600 text-sm mt-4">Nhập thông tin bên dưới để tạo tài khoản</p>
                    </div>

                    {globalError && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-sm text-red-600">
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            <span>{globalError}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="form-field-group">
                            <label htmlFor="displayName" className="block text-gray-700 text-sm font-medium mb-1">
                                Tên hiển thị
                            </label>
                            <div className="form-input-wrapper">
                                <input
                                    id="displayName"
                                    type="text"
                                    placeholder="Nhập tên hiển thị"
                                    className={`form-input field--${getFieldState('displayName')} pr-10`}
                                    {...register('displayName')}
                                />
                                {getFieldState('displayName') === 'error' && (
                                    <AlertCircle className="absolute right-3.5 top-1/2 -translate-y-1/2 text-red-500 w-5 h-5" />
                                )}
                                {getFieldState('displayName') === 'success' && (
                                    <Check className="absolute right-3.5 top-1/2 -translate-y-1/2 text-green-500 w-5 h-5" />
                                )}
                            </div>
                            {renderFieldMessage('displayName')}
                        </div>

                        <div className="form-field-group">
                            <label htmlFor="username" className="block text-gray-700 text-sm font-medium mb-1">
                                Tên đăng nhập
                            </label>
                            <div className="form-input-wrapper">
                                <input
                                    id="username"
                                    type="text"
                                    placeholder="Chọn tên đăng nhập"
                                    className={`form-input field--${getFieldState('username')} pr-10`}
                                    {...register('username')}
                                />
                                {getFieldState('username') === 'error' && (
                                    <AlertCircle className="absolute right-3.5 top-1/2 -translate-y-1/2 text-red-500 w-5 h-5" />
                                )}
                                {getFieldState('username') === 'success' && (
                                    <Check className="absolute right-3.5 top-1/2 -translate-y-1/2 text-green-500 w-5 h-5" />
                                )}
                            </div>
                            {renderFieldMessage('username')}
                        </div>

                        <div className="form-field-group">
                            <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-1">
                                Email
                            </label>
                            <div className="form-input-wrapper">
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="Nhập email"
                                    className={`form-input field--${getFieldState('email')} pr-10`}
                                    {...register('email')}
                                />
                                {getFieldState('email') === 'error' && (
                                    <AlertCircle className="absolute right-3.5 top-1/2 -translate-y-1/2 text-red-500 w-5 h-5" />
                                )}
                                {getFieldState('email') === 'success' && (
                                    <Check className="absolute right-3.5 top-1/2 -translate-y-1/2 text-green-500 w-5 h-5" />
                                )}
                            </div>
                            {renderFieldMessage('email')}
                        </div>

                        <div className="form-field-group">
                            <label htmlFor="phoneNumber" className="block text-gray-700 text-sm font-medium mb-1">
                                Số điện thoại
                            </label>
                            <div className="form-input-wrapper">
                                <input
                                    id="phoneNumber"
                                    type="text"
                                    placeholder="Nhập số điện thoại"
                                    className={`form-input field--${getFieldState('phoneNumber')} pr-10`}
                                    {...register('phoneNumber')}
                                />
                                {getFieldState('phoneNumber') === 'error' && (
                                    <AlertCircle className="absolute right-3.5 top-1/2 -translate-y-1/2 text-red-500 w-5 h-5" />
                                )}
                                {getFieldState('phoneNumber') === 'success' && (
                                    <Check className="absolute right-3.5 top-1/2 -translate-y-1/2 text-green-500 w-5 h-5" />
                                )}
                            </div>
                            {renderFieldMessage('phoneNumber')}
                        </div>

                        <div className="form-field-group">
                            <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-1">
                                Mật khẩu
                            </label>
                            <div className="form-input-wrapper">
                                <input
                                    id="password"
                                    type="password"
                                    placeholder="Tạo mật khẩu"
                                    className={`form-input field--${getFieldState('password')} pr-10`}
                                    {...register('password')}
                                />
                                {getFieldState('password') === 'error' && (
                                    <AlertCircle className="absolute right-3.5 top-1/2 -translate-y-1/2 text-red-500 w-5 h-5" />
                                )}
                                {getFieldState('password') === 'success' && (
                                    <Check className="absolute right-3.5 top-1/2 -translate-y-1/2 text-green-500 w-5 h-5" />
                                )}
                            </div>
                            {renderFieldMessage('password')}
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full text-white font-bold py-3 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                            style={{
                                background: 'linear-gradient(to right, #f97316, #ea580c)',
                                border: 'none',
                                padding: '0.75rem 1rem',
                                fontFamily: 'inherit',
                                borderRadius: '12px',
                                boxShadow: '0 10px 20px rgba(234, 88, 12, 0.35)',
                                marginTop: '8px'
                            }}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Đang đăng ký...
                                </>
                            ) : (
                                'Đăng ký'
                            )}
                        </button>

                        <div className="text-center text-sm text-gray-600 mt-4">
                            Đã có tài khoản?{' '}
                            <Link
                                href="/"
                                className="text-orange-600 hover:text-orange-700 font-semibold hover:underline transition-colors"
                            >
                                Đăng nhập
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
