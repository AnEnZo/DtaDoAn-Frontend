import { create } from 'zustand';
import {
    setToken,
    removeToken,
    getUserFromToken,
    DecodedToken,
    isAuthenticated,
    getRolesFromToken
} from '@/lib/auth/auth-utils';

interface AuthState {
    user: DecodedToken | null;
    isLoggedIn: boolean;
    roles: string[];

    // Actions
    login: (token: string) => void;
    logout: () => void;
    syncAuth: () => void;
    getRedirectPath: () => string;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
    user: null,
    isLoggedIn: false,
    roles: [],

    login: (token: string) => {
        setToken(token);
        const user = getUserFromToken();
        const roles = getRolesFromToken();
        set({ isLoggedIn: true, user: user, roles });
    },

    logout: () => {
        removeToken();
        set({ isLoggedIn: false, user: null, roles: [] });
    },

    syncAuth: () => {
        const isAuth = isAuthenticated();
        if (isAuth) {
            const user = getUserFromToken();
            const roles = getRolesFromToken();
            set({ isLoggedIn: true, user, roles });
        } else {
            set({ isLoggedIn: false, user: null, roles: [] });
        }
    },

    getRedirectPath: () => {
        const { roles } = get();
        if (roles.includes('ROLE_ADMIN') || roles.includes('ADMIN')) {
            return '/dashboard';
        }
        if (roles.includes('ROLE_STAFF') || roles.includes('STAFF')) {
            return '/home';
        }
        return '/home';
    },
}));
