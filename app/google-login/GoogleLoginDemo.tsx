"use client";

import { User } from "@supabase/supabase-js";
import { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser-clients";
import { GoogleAuthButton } from "@/app/components/AuthDemoPage";

type GoogleLoginDemoProps = {
    user: User | null;
};

export default function GoogleLoginDemo({ user: initialUser }: GoogleLoginDemoProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(initialUser);
    const supabase = createSupabaseBrowserClient();

    useEffect(() => {
        const { data: authListener } = supabase.auth.onAuthStateChange(
            (event, session) => {
                setUser(session?.user ?? null);
            }
        );

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [supabase.auth]);

    async function handleGoogleLogin() {
        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${location.origin}/auth/callback`,
            },
        });

        if (error) {
            console.error("Error signing in with Google:", error);
        }
        setLoading(false);
    }

    async function handleSignOut() {
        setLoading(true);
        setError(null);
        const { error } = await supabase.auth.signOut();
        if (error) {
            setError(error.message);
            console.error("Error signing out:", error);
        }
        setLoading(false);
    }

    // If user is logged in, show user dashboard
    if (user) {
        const { full_name, avatar_url } = user.user_metadata;
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute top-40 right-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
                </div>

                <div className="relative w-full max-w-md">
                    <div className="bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl p-10 border border-white/20">
                        <div className="text-center mb-8">
                            <h1 className="text-4xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
                                Welcome Back!
                            </h1>
                            <p className="text-gray-300 text-sm">You're logged in with Google.</p>
                        </div>

                        <div className="bg-white/5 rounded-2xl p-8 border border-white/10 mb-8 text-center">
                            <img
                                src={avatar_url || `https://i.pravatar.cc/150?u=${user.id}`}
                                alt="User Avatar"
                                className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-purple-500/50 shadow-lg"
                            />
                            <h2 className="text-2xl font-bold text-white mb-1">
                                {full_name || user.email?.split('@')[0] || 'User'}
                            </h2>
                            <p className="text-gray-400 text-sm break-all">{user.email}</p>
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm mb-6">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleSignOut}
                            disabled={loading}
                            className="w-full py-3 px-6 bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold rounded-xl hover:from-red-600 hover:to-pink-600 disabled:opacity-50 transition-all duration-300 shadow-lg shadow-red-500/50 hover:shadow-xl transform hover:scale-105"
                        >
                            {loading ? "Signing out..." : "Sign Out"}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // If user is NOT logged in, show login button
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute top-40 right-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            <div className="relative w-full max-w-md">
                <div className="bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl p-10 border border-white/20 text-center">
                    <h1 className="text-5xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
                        Join Us
                    </h1>
                    <p className="text-gray-300 text-sm mb-10">
                        Sign in with one click. It's that easy.
                    </p>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm mb-6">
                            {error}
                        </div>
                    )}

                    <GoogleAuthButton
                        onClick={handleGoogleLogin}
                        loading={loading}
                        disabled={loading}
                    />
                </div>
            </div>
            <style jsx>{`
                @keyframes blob {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                }
                .animate-blob { animation: blob 7s infinite; }
                .animation-delay-2000 { animation-delay: 2s; }
                .animation-delay-4000 { animation-delay: 4s; }
            `}</style>
        </div>
    );
}
