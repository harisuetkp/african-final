/**
 * Auth Context (Supabase replacement for Base44 AuthContext)
 * 
 * Drop-in replacement for Afrinnect's AuthContext.jsx.
 * Uses Supabase auth instead of Base44's token-based auth.
 */
import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/lib/supabase-client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);
    const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
    const [authError, setAuthError] = useState(null);
    const [appPublicSettings, setAppPublicSettings] = useState({ id: 'afrinnect', public_settings: {} });

    useEffect(() => {
        checkAuthState();

        // Listen for Supabase auth state changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                await checkAuthState();
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setIsAuthenticated(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const checkAuthState = async () => {
        try {
            setIsLoadingAuth(true);
            setAuthError(null);

            const currentUser = await base44.auth.me();
            setUser(currentUser);
            setIsAuthenticated(true);
        } catch (error) {
            console.log('User not authenticated:', error.message);
            setUser(null);
            setIsAuthenticated(false);

            // Only set auth error if it's not a simple "not logged in" situation
            if (error.message !== 'Not authenticated') {
                setAuthError({
                    type: 'auth_required',
                    message: error.message,
                });
            }
        } finally {
            setIsLoadingAuth(false);
        }
    };

    const logout = async (shouldRedirect = true) => {
        setUser(null);
        setIsAuthenticated(false);

        if (shouldRedirect) {
            await base44.auth.logout(window.location.href);
        } else {
            await base44.auth.logout();
        }
    };

    const navigateToLogin = () => {
        base44.auth.redirectToLogin(window.location.href);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated,
                isLoadingAuth,
                isLoadingPublicSettings,
                authError,
                appPublicSettings,
                logout,
                navigateToLogin,
                checkAppState: checkAuthState,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
