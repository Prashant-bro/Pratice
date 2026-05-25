"use client";
import link from "next/link";
import type {ReactNode} from "react";

type AuthDemoPageProps = {
    title : string;
    intro : string;
    steps : string[];
    children : ReactNode;
}

// Reusable Auth Input Component
export function AuthInput({
    type = "text",
    placeholder,
    value,
    onChange,
    disabled = false,
    error,
}: {
    type?: string;
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    error?: string;
}) {
    return (
        <div className="w-full">
            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
        </div>
    );
}

// Reusable Auth Button Component
export function AuthButton({
    children,
    onClick,
    disabled = false,
    loading = false,
    variant = "primary",
}: {
    children: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    loading?: boolean;
    variant?: "primary" | "secondary";
}) {
    const baseClass = "w-full px-4 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
    const variantClass = 
        variant === "primary" 
            ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg hover:shadow-xl"
            : "bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:border-white/30";

    return (
        <button
            onClick={onClick}
            disabled={disabled || loading}
            className={`${baseClass} ${variantClass}`}
        >
            {loading && <span className="animate-spin">⏳</span>}
            {children}
        </button>
    );
}

// Google Auth Button Component
export function GoogleAuthButton({
    onClick,
    disabled = false,
    loading = false,
}: {
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled || loading}
            className="w-full px-4 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-white text-slate-900 hover:bg-gray-100 shadow-lg hover:shadow-xl border border-white/20"
        >
            {loading ? (
                <span className="animate-spin">⏳</span>
            ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="currentColor" fontSize="14" fontWeight="bold">G</text>
                </svg>
            )}
            {loading ? "Signing in..." : "Continue with Google"}
        </button>
    );
}

// Auth Divider Component
export function AuthDivider() {
    return (
        <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <span className="text-gray-400 text-sm">or</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>
    );
}

// Auth Form Container Component
export function AuthFormContainer({
    children,
    onSubmit,
}: {
    children: ReactNode;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
    return (
        <form onSubmit={onSubmit} className="space-y-4">
            {children}
        </form>
    );
}

// Auth Error Message Component
export function AuthError({ message }: { message?: string }) {
    if (!message) return null;
    return (
        <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm">
            {message}
        </div>
    );
}

// Auth Success Message Component
export function AuthSuccess({ message }: { message?: string }) {
    if (!message) return null;
    return (
        <div className="p-3 rounded-lg bg-green-500/20 border border-green-500/50 text-green-200 text-sm">
            {message}
        </div>
    );
}


export function AuthDemoPage({ title, intro, steps, children } : AuthDemoPageProps) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
            <div className="relative w-full max-w-3xl">
                <div className="bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl p-10 border border-white/20">
                    <div className="text-center mb-10">
                        <h1 className="text-5xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                            {title}
                        </h1>
                        <p className="text-gray-300 text-sm">{intro}</p>    
                    </div>
                    <div className="mb-10">
                        <h2 className="text-2xl font-bold text-white mb-4">Steps to Try It Out:</h2>   
                        <ol className="list-decimal list-inside text-gray-300 space-y-2">
                            {steps.map((step, index) => (
                                <li key={index}>{step}</li>
                            ))}
                        </ol>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}