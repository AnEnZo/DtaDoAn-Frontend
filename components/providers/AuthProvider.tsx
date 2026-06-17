'use client';
import { useEffect } from 'react';
import { App as AntdApp } from 'antd';
import { useAuthStore } from '@/lib/store/auth-store';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const syncAuth = useAuthStore((state) => state.syncAuth);

    useEffect(() => {
        syncAuth();
    }, [syncAuth]);

    // antd <App> provides the message/notification/modal context app-wide so
    // App.useApp() works everywhere and toasts render correctly under it.
    return <AntdApp>{children}</AntdApp>;
}
