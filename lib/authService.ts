import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export interface AuthResult {
    success: boolean;
    user?: User | null;
    error?: string;
}

export class AuthService {
    /**
     * Sign in anonymously with hCaptcha verification
     * @param captchaToken - The hCaptcha token from successful captcha completion
     * @returns Promise<AuthResult> - Result of the authentication
     */
    static async signInAnonymously(captchaToken: string): Promise<AuthResult> {
        try {
            const { data, error } = await supabase.auth.signInAnonymously({
                options: {
                    captchaToken: captchaToken,
                }
            });

            if (error) {
                console.error('Anonymous sign-in error:', error);
                return {
                    success: false,
                    error: `Authentication failed: ${error.message}`
                };
            }

            if (data.user) {
                console.log('Anonymous user signed in:', data.user.id);
                return {
                    success: true,
                    user: data.user
                };
            }

            return {
                success: false,
                error: 'No user returned from authentication'
            };

        } catch (error) {
            console.error('Authentication error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown authentication error'
            };
        }
    }

    /**
     * Get current user session
     * @returns Promise<AuthResult> - Current user session
     */
    static async getCurrentUser(): Promise<AuthResult> {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();

            if (error) {
                return {
                    success: false,
                    error: `Failed to get user: ${error.message}`
                };
            }

            return {
                success: true,
                user: user
            };

        } catch (error) {
            console.error('Get user error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error getting user'
            };
        }
    }

    /**
     * Sign out current user
     * @returns Promise<AuthResult> - Result of sign out
     */
    static async signOut(): Promise<AuthResult> {
        try {
            const { error } = await supabase.auth.signOut();

            if (error) {
                return {
                    success: false,
                    error: `Sign out failed: ${error.message}`
                };
            }

            return {
                success: true
            };

        } catch (error) {
            console.error('Sign out error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown sign out error'
            };
        }
    }

    /**
     * Check if user is authenticated
     * @returns Promise<boolean> - Whether user is authenticated
     */
    static async isAuthenticated(): Promise<boolean> {
        const result = await this.getCurrentUser();
        return result.success && !!result.user;
    }
}
