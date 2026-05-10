'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    DecodedToken,
    getToken,
    setToken,
    removeToken,
    parseJwt,
    getRolesFromToken,
    isAuthenticated as checkAuth,
} from '../auth/auth-utils';

export interface UseAuthResult {
    user: DecodedToken | null;
    roles: string[];
    isAuthenticated: boolean;
    loading: boolean;
    login: (token: string) => void;
    logout: () => void;
}

export function useAuth(): UseAuthResult {
    const [user, setUser] = useState<DecodedToken | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    // Initialize auth state from cookies
    useEffect(() => {
        const token = getToken();
        const userInfo = token ? parseJwt(token) : null;
        setUser(userInfo);
        setLoading(false);
    }, []);

    const login = useCallback((token: string) => {
        // Store token in cookies
        setToken(token);

        // Parse and set user info
        const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
        const userInfo = parseJwt(cleanToken);
        setUser(userInfo);
    }, []);

    const logout = useCallback(() => {
        // Remove token from cookies
        removeToken();
        setUser(null);
    }, []);

    return {
        user,
        roles: getRolesFromToken(),
        isAuthenticated: checkAuth(),
        loading,
        login,
        logout,
    };
}
