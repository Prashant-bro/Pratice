"use client";

import { User } from "@supabase/supabase-js";
import { useState} from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser-clients";
import { AuthInput, AuthButton, AuthFormContainer, AuthError, AuthSuccess, AuthDivider } from "@/app/components/AuthDemoPage";

type EmailPasswordDemoProps = {
    user : User | null;
}
type mode = 'signin' | 'signup';
export default function EmailPasswordDemo({ user: initialUser } : EmailPasswordDemoProps) {
    const [mode, setMode] = useState<mode>('signup');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(initialUser);
    const supabase = createSupabaseBrowserClient();

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            if (mode == "signup") {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password
                });
                if (error) {
                    setError(error.message);
                    console.error('Error signing up:', error);
                } else {
                    setSuccess('Sign up successful! Please check your email to confirm.');
                    setEmail('');
                    setPassword('');
                    setMode('signin');
                }
            }
            if (mode == "signin") {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });
                if (error) {
                    setError(error.message);
                    console.error('Error signing in:', error);
                } else {
                    setSuccess('Sign in successful!');
                    setUser(data.user);
                    setEmail('');
                    setPassword('');
                }
            }
        } catch (err) {
            setError('An unexpected error occurred');
            console.error(err);
        }
        setLoading(false);
    }

    async function handleSignOut() {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                setError(error.message);
                console.error('Error signing out:', error);
            } else {
                setSuccess('Signed out successfully!');
                setUser(null);
                setEmail('');
                setPassword('');
            }
        } catch (err) {
            setError('An unexpected error occurred');
            console.error(err);
        }
        setLoading(false);
    }

    // If user is logged in, show user dashboard
    if (user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
                {/* Animated background elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute top-40 right-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
                </div>

                <div className="relative w-full max-w-md">
                    <div className="bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl p-10 border border-white/20">
                        {/* Header */}
                        <div className="text-center mb-10">
                            <h1 className="text-5xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
                                Welcome! 👋
                            </h1>
                            <p className="text-gray-300 text-sm">You're successfully logged in</p>
                        </div>

                        {/* User Info Card */}
                        <div className="bg-white/5 rounded-2xl p-8 border border-white/10 mb-8">
                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-3xl">
                                    👤
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">
                                    {user?.email?.split('@')[0] || 'User'}
                                </h2>
                                <p className="text-gray-400 text-sm break-all mb-4">{user?.email}</p>
                                <div className="flex gap-2 text-xs text-gray-400 mb-4">
                                    <span className="bg-white/10 px-3 py-1 rounded-full">
                                        ID: {user?.id?.slice(0, 8)}...
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Success Message */}
                        {success && (
                            <div className="p-3 rounded-lg bg-green-500/20 border border-green-500/50 text-green-200 text-sm mb-6">
                                {success}
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm mb-6">
                                {error}
                            </div>
                        )}

                        {/* Sign Out Button */}
                        <button 
                            onClick={handleSignOut}
                            disabled={loading}
                            className="w-full py-4 px-6 bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold rounded-xl hover:from-red-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-red-500/50 hover:shadow-xl hover:shadow-red-500/70 transform hover:scale-105 active:scale-95"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <span className="animate-spin mr-2">⏳</span> Signing out...
                                </span>
                            ) : (
                                <span>🚪 Sign Out</span>
                            )}
                        </button>
                    </div>
                </div>

                <style jsx>{`
                    @keyframes blob {
                        0%, 100% {
                            transform: translate(0, 0) scale(1);
                        }
                        33% {
                            transform: translate(30px, -50px) scale(1.1);
                        }
                        66% {
                            transform: translate(-20px, 20px) scale(0.9);
                        }
                    }
                    .animate-blob {
                        animation: blob 7s infinite;
                    }
                    .animation-delay-2000 {
                        animation-delay: 2s;
                    }
                    .animation-delay-4000 {
                        animation-delay: 4s;
                    }
                `}</style>
            </div>
        );
    }

    // If user is NOT logged in, show login/signup form

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute top-40 right-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            <div className="relative w-full max-w-md">
                {/* Main card */}
                <div className="bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl p-10 border border-white/20">
                    {/* Header */}
                    <div className="text-center mb-10">
                        <h1 className="text-5xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                            Welcome Back
                        </h1>
                        <p className="text-gray-300 text-sm">Secure authentication with email & password</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm mb-6">
                            {error}
                        </div>
                    )}

                    {/* Success Message */}
                    {success && (
                        <div className="p-3 rounded-lg bg-green-500/20 border border-green-500/50 text-green-200 text-sm mb-6">
                            {success}
                        </div>
                    )}

                    {/* Mode Tabs */}
                    <div className="flex gap-3 mb-10 bg-white/5 p-1 rounded-xl border border-white/10">
                        <button 
                            onClick={() => setMode('signin')}
                            className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all duration-300 ${
                                mode === 'signin' 
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-purple-500/50' 
                                    : 'text-gray-300 hover:text-white'
                            }`}
                        >
                            Sign In
                        </button>
                        <button 
                            onClick={() => setMode('signup')}
                            className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all duration-300 ${
                                mode === 'signup' 
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-purple-500/50' 
                                    : 'text-gray-300 hover:text-white'
                            }`}
                        >
                            Sign Up
                        </button>
                    </div>

                    {/* Form */}
                    <AuthFormContainer onSubmit={handleSubmit}>
                        {/* Email Input */}
                        <AuthInput
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={setEmail}
                        />

                        {/* Password Input */}
                        <AuthInput
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={setPassword}
                        />

                        {/* Submit Button */}
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-bold rounded-xl hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 mt-8 shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/70 transform hover:scale-105 active:scale-95"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <span className="animate-spin mr-2">⏳</span> Processing...
                                </span>
                            ) : (
                                <span>{mode === 'signin' ? '🔓 Sign In' : '✨ Create Account'}</span>
                            )}
                        </button>
                    </AuthFormContainer>

                    {/* Divider */}
                    <AuthDivider />

                    {/* Social buttons */}
                    <div className="grid grid-cols-2 gap-4">
                        <button className="py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/20 rounded-xl text-gray-200 font-semibold transition-all duration-300 hover:text-white">
                            Google
                        </button>
                        <button className="py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/20 rounded-xl text-gray-200 font-semibold transition-all duration-300 hover:text-white">
                            GitHub
                        </button>
                    </div>

                    {/* Footer */}
                    <p className="text-center text-gray-400 text-xs mt-8">
                        {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
                        <button 
                            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                            className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
                        >
                            {mode === 'signin' ? 'Sign Up' : 'Sign In'}
                        </button>
                    </p>
                </div>
            </div>

            <style jsx>{`
                @keyframes blob {
                    0%, 100% {
                        transform: translate(0, 0) scale(1);
                    }
                    33% {
                        transform: translate(30px, -50px) scale(1.1);
                    }
                    66% {
                        transform: translate(-20px, 20px) scale(0.9);
                    }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
            `}</style>
        </div>
    );
}
