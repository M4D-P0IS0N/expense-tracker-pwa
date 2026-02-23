import { supabase } from './supabaseClient.js';

export const AuthService = {
    // 1. Criar Nova Conta
    async signUp(email, password) {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    // Impede o redirecionamento automático que quebra o PWA às vezes em dev.
                    emailRedirectTo: window.location.origin
                }
            });
            if (error) throw error;
            return { user: data.user, session: data.session };
        } catch (error) {
            console.error("SignUp Error:", error.message);
            throw error;
        }
    },

    // 2. Login
    async signIn(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            if (error) throw error;
            return { user: data.user, session: data.session };
        } catch (error) {
            console.error("SignIn Error:", error.message);
            throw error;
        }
    },

    // 3. Logout
    async signOut() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
        } catch (error) {
            console.error("SignOut Error:", error.message);
            throw error;
        }
    },

    // 4. Recuperar Senha (Envia email mágico)
    async resetPassword(email) {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/login.html?reset=true`
            });
            if (error) throw error;
        } catch (error) {
            console.error("ResetPassword Error:", error.message);
            throw error;
        }
    },

    // 5. Obter sessão atual (checa LocalStorage automaticamente pelo Supabase SDK)
    async getSession() {
        try {
            const { data, error } = await supabase.auth.getSession();
            if (error) throw error;
            return data.session;
        } catch (error) {
            console.error("GetSession Error:", error.message);
            return null;
        }
    },

    // 6. Listener para reatividade (ex: deslogar se session expirar em outra aba)
    onAuthStateChange(callback) {
        return supabase.auth.onAuthStateChange((event, session) => {
            callback(event, session);
        });
    }
};
