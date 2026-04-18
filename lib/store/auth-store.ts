import { create } from 'zustand';
import {
    setToken,
    removeToken,
    getUserFromToken,
    DecodedToken,
    isAuthenticated
} from '@/lib/auth/auth-utils';

interface AuthState {
    user: DecodedToken | null;
    isLoggedIn: boolean;

    // Actions
    login: (token: string) => void;
    logout: () => void;
    syncAuth: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
    user: null,
    isLoggedIn: false,

    login: (token: string) => {
        setToken(token);
        const user = getUserFromToken();
        set({ isLoggedIn: true, user: user });
    },

    logout: () => {
        removeToken();
        set({ isLoggedIn: false, user: null });
        // Optional: Redirect to login page if needed
        // window.location.href = '/login'; 
    },

    syncAuth: () => {
        const isAuth = isAuthenticated();
        if (isAuth) {
            const user = getUserFromToken();
            set({ isLoggedIn: true, user });
        } else {
            set({ isLoggedIn: false, user: null });
        }
    },
}));
