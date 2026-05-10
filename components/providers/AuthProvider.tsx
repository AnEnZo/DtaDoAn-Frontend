'use client';
import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/auth-store';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const syncAuth = useAuthStore((state) => state.syncAuth);

    useEffect(() => {
        syncAuth();
    }, [syncAuth]);

    return <>{children}</>;
}
