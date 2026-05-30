"use client";

import { User } from "@supabase/supabase-js";
import { useState, useRef, useEffect, useCallback } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser-clients";

type PhoneLoginDemoProps = {
    user: User | null;
};

type Phase = "phone" | "otp";

const COUNTRY_CODES = [
    { code: "+91", label: "🇮🇳 +91", country: "India" },
    { code: "+1", label: "🇺🇸 +1", country: "USA" },
    { code: "+44", label: "🇬🇧 +44", country: "UK" },
    { code: "+61", label: "🇦🇺 +61", country: "Australia" },
    { code: "+971", label: "🇦🇪 +971", country: "UAE" },
    { code: "+65", label: "🇸🇬 +65", country: "Singapore" },
    { code: "+81", label: "🇯🇵 +81", country: "Japan" },
];

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30;

export default function PhoneLoginDemo({ user: initialUser }: PhoneLoginDemoProps) {
    const [phase, setPhase] = useState<Phase>("phone");
    const [countryCode, setCountryCode] = useState("+91");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(initialUser);
    const [resendTimer, setResendTimer] = useState(0);
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);

    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const supabase = createSupabaseBrowserClient();

    // Listen for auth state changes
    useEffect(() => {
        const { data: authListener } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setUser(session?.user ?? null);
            }
        );
        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [supabase.auth]);

    // Resend countdown timer
    useEffect(() => {
        if (resendTimer > 0) {
            timerRef.current = setTimeout(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [resendTimer]);

    const fullPhone = `${countryCode.replace("+", "")}${phoneNumber}`;

    // --- Handlers ---

    async function handleSendOTP() {
        if (!phoneNumber || phoneNumber.length < 10) {
            setError("Please enter a valid phone number");
            return;
        }
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const res = await fetch("/api/auth/otp/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone: fullPhone }),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Failed to send OTP");
            } else {
                setSuccess("OTP sent! Check your phone 📱");
                setPhase("otp");
                setResendTimer(RESEND_COOLDOWN);
                // Focus the first OTP input
                setTimeout(() => otpRefs.current[0]?.focus(), 100);
            }
        } catch {
            setError("Network error. Please try again.");
        }
        setLoading(false);
    }

    async function handleVerifyOTP() {
        const otpString = otp.join("");
        if (otpString.length !== OTP_LENGTH) {
            setError("Please enter the complete 6-digit OTP");
            return;
        }
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const res = await fetch("/api/auth/otp/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone: fullPhone, otp: otpString }),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Verification failed");
            } else if (data.session) {
                // Set the session on the client
                const { error: sessionError } = await supabase.auth.setSession({
                    access_token: data.session.access_token,
                    refresh_token: data.session.refresh_token,
                });

                if (sessionError) {
                    console.error("Error setting session:", sessionError);
                    setError("Login failed. Please try again.");
                } else {
                    setSuccess("Phone verified! You're logged in 🎉");
                    setUser(data.user);
                }
            }
        } catch {
            setError("Network error. Please try again.");
        }
        setLoading(false);
    }

    async function handleResendOTP() {
        if (resendTimer > 0) return;
        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/auth/otp/resend", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone: fullPhone }),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Failed to resend OTP");
            } else {
                setSuccess("OTP resent! Check your phone 📱");
                setResendTimer(RESEND_COOLDOWN);
                setOtp(Array(OTP_LENGTH).fill(""));
                otpRefs.current[0]?.focus();
            }
        } catch {
            setError("Network error. Please try again.");
        }
        setLoading(false);
    }

    async function handleSignOut() {
        setLoading(true);
        setError(null);
        const { error } = await supabase.auth.signOut();
        if (error) {
            setError(error.message);
        } else {
            setSuccess("Signed out successfully!");
            setUser(null);
            setPhase("phone");
            setPhoneNumber("");
            setOtp(Array(OTP_LENGTH).fill(""));
        }
        setLoading(false);
    }

    // OTP input handlers
    const handleOtpChange = useCallback(
        (index: number, value: string) => {
            // Only allow single digits
            if (value && !/^\d$/.test(value)) return;

            const newOtp = [...otp];
            newOtp[index] = value;
            setOtp(newOtp);

            // Auto-advance to next input
            if (value && index < OTP_LENGTH - 1) {
                otpRefs.current[index + 1]?.focus();
            }
        },
        [otp]
    );

    const handleOtpKeyDown = useCallback(
        (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Backspace") {
                if (otp[index] === "" && index > 0) {
                    // Move to previous input and clear it
                    const newOtp = [...otp];
                    newOtp[index - 1] = "";
                    setOtp(newOtp);
                    otpRefs.current[index - 1]?.focus();
                } else {
                    const newOtp = [...otp];
                    newOtp[index] = "";
                    setOtp(newOtp);
                }
            } else if (e.key === "ArrowLeft" && index > 0) {
                otpRefs.current[index - 1]?.focus();
            } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
                otpRefs.current[index + 1]?.focus();
            }
        },
        [otp]
    );

    const handleOtpPaste = useCallback(
        (e: React.ClipboardEvent<HTMLInputElement>) => {
            e.preventDefault();
            const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
            if (pastedData.length === 0) return;

            const newOtp = [...otp];
            for (let i = 0; i < pastedData.length; i++) {
                newOtp[i] = pastedData[i];
            }
            setOtp(newOtp);

            // Focus the next empty input or the last filled one
            const nextEmptyIndex = newOtp.findIndex((val) => val === "");
            if (nextEmptyIndex !== -1) {
                otpRefs.current[nextEmptyIndex]?.focus();
            } else {
                otpRefs.current[OTP_LENGTH - 1]?.focus();
            }
        },
        [otp]
    );

    // ===== LOGGED IN STATE =====
    if (user) {
        const displayName = user.user_metadata?.phone || user.phone || user.email?.split("@")[0] || "User";
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute top-40 right-10 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
                </div>

                <div className="relative w-full max-w-md">
                    <div className="bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl p-10 border border-white/20">
                        <div className="text-center mb-10">
                            <h1 className="text-5xl font-black bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent mb-4">
                                Welcome! 📱
                            </h1>
                            <p className="text-gray-300 text-sm">Logged in via Phone OTP</p>
                        </div>

                        <div className="bg-white/5 rounded-2xl p-8 border border-white/10 mb-8">
                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center text-3xl">
                                    📞
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">
                                    {displayName}
                                </h2>
                                <p className="text-gray-400 text-sm break-all mb-4">
                                    {user.email !== `${displayName}@phone.user` ? user.email : `+${displayName}`}
                                </p>
                                <div className="flex gap-2 text-xs text-gray-400 justify-center">
                                    <span className="bg-white/10 px-3 py-1 rounded-full">
                                        ID: {user.id?.slice(0, 8)}...
                                    </span>
                                    <span className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full">
                                        Phone Verified ✓
                                    </span>
                                </div>
                            </div>
                        </div>

                        {success && (
                            <div className="p-3 rounded-lg bg-green-500/20 border border-green-500/50 text-green-200 text-sm mb-6">
                                {success}
                            </div>
                        )}
                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm mb-6">
                                {error}
                            </div>
                        )}

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

    // ===== NOT LOGGED IN — PHONE / OTP FORM =====
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute top-40 right-10 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            <div className="relative w-full max-w-md">
                <div className="bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl p-10 border border-white/20">
                    {/* Header */}
                    <div className="text-center mb-10">
                        <h1 className="text-5xl font-black bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
                            Phone Login
                        </h1>
                        <p className="text-gray-300 text-sm">
                            {phase === "phone"
                                ? "Enter your phone number to receive an OTP"
                                : "Enter the 6-digit code sent to your phone"}
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm mb-6 animate-shake">
                            {error}
                        </div>
                    )}

                    {/* Success Message */}
                    {success && (
                        <div className="p-3 rounded-lg bg-green-500/20 border border-green-500/50 text-green-200 text-sm mb-6">
                            {success}
                        </div>
                    )}

                    {phase === "phone" ? (
                        /* ===== PHASE 1: Enter Phone Number ===== */
                        <div className="space-y-6">
                            {/* Phone Input with Country Code */}
                            <div className="relative">
                                <label className="block text-gray-300 text-sm font-semibold mb-2">
                                    Phone Number
                                </label>
                                <div className="flex gap-2">
                                    {/* Country Code Selector */}
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                                            className="h-full px-3 py-3 rounded-lg bg-white/5 border border-white/20 text-white text-sm font-mono focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all min-w-[80px] flex items-center gap-1"
                                        >
                                            {COUNTRY_CODES.find((c) => c.code === countryCode)?.label || countryCode}
                                            <svg className="w-3 h-3 ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                        {showCountryDropdown && (
                                            <div className="absolute top-full left-0 mt-1 w-48 bg-slate-800 border border-white/20 rounded-lg shadow-2xl z-50 overflow-hidden">
                                                {COUNTRY_CODES.map((c) => (
                                                    <button
                                                        key={c.code}
                                                        onClick={() => {
                                                            setCountryCode(c.code);
                                                            setShowCountryDropdown(false);
                                                        }}
                                                        className={`w-full px-4 py-2.5 text-left text-sm hover:bg-white/10 transition-colors flex items-center justify-between ${
                                                            countryCode === c.code
                                                                ? "text-emerald-400 bg-white/5"
                                                                : "text-gray-300"
                                                        }`}
                                                    >
                                                        <span>{c.label}</span>
                                                        <span className="text-xs text-gray-500">{c.country}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Phone Number Input */}
                                    <input
                                        type="tel"
                                        placeholder="9876543210"
                                        value={phoneNumber}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, "");
                                            setPhoneNumber(val);
                                        }}
                                        maxLength={15}
                                        className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-400 font-mono text-lg tracking-wider focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Send OTP Button */}
                            <button
                                onClick={handleSendOTP}
                                disabled={loading || phoneNumber.length < 10}
                                className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 via-cyan-500 to-purple-500 text-white font-bold rounded-xl hover:from-emerald-600 hover:via-cyan-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/50 transform hover:scale-105 active:scale-95"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center">
                                        <span className="animate-spin mr-2">⏳</span> Sending OTP...
                                    </span>
                                ) : (
                                    <span>📨 Send OTP</span>
                                )}
                            </button>
                        </div>
                    ) : (
                        /* ===== PHASE 2: Enter OTP ===== */
                        <div className="space-y-6">
                            {/* Phone display */}
                            <div className="flex items-center justify-center gap-2 text-gray-300 text-sm">
                                <span>Code sent to</span>
                                <span className="font-mono font-bold text-emerald-400">
                                    {countryCode} {phoneNumber}
                                </span>
                                <button
                                    onClick={() => {
                                        setPhase("phone");
                                        setOtp(Array(OTP_LENGTH).fill(""));
                                        setError(null);
                                        setSuccess(null);
                                    }}
                                    className="text-purple-400 hover:text-purple-300 underline text-xs ml-1 transition-colors"
                                >
                                    Change
                                </button>
                            </div>

                            {/* 6 OTP Input Boxes */}
                            <div className="flex justify-center gap-3">
                                {Array.from({ length: OTP_LENGTH }).map((_, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => {
                                            otpRefs.current[index] = el;
                                        }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={otp[index]}
                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                        onPaste={index === 0 ? handleOtpPaste : undefined}
                                        autoComplete="one-time-code"
                                        className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 bg-white/5 text-white focus:outline-none transition-all duration-200 ${
                                            otp[index]
                                                ? "border-emerald-400 shadow-lg shadow-emerald-400/20"
                                                : "border-white/20 hover:border-white/40"
                                        } focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 focus:scale-110`}
                                    />
                                ))}
                            </div>

                            {/* Verify Button */}
                            <button
                                onClick={handleVerifyOTP}
                                disabled={loading || otp.join("").length !== OTP_LENGTH}
                                className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 via-cyan-500 to-purple-500 text-white font-bold rounded-xl hover:from-emerald-600 hover:via-cyan-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/50 transform hover:scale-105 active:scale-95"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center">
                                        <span className="animate-spin mr-2">⏳</span> Verifying...
                                    </span>
                                ) : (
                                    <span>✅ Verify OTP</span>
                                )}
                            </button>

                            {/* Resend Timer / Button */}
                            <div className="text-center">
                                {resendTimer > 0 ? (
                                    <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
                                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="32" strokeDashoffset="32" className="animate-timer-circle" />
                                        </svg>
                                        <span>
                                            Resend OTP in{" "}
                                            <span className="font-mono font-bold text-cyan-400">
                                                {resendTimer}s
                                            </span>
                                        </span>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleResendOTP}
                                        disabled={loading}
                                        className="text-emerald-400 hover:text-emerald-300 font-semibold text-sm transition-colors underline underline-offset-4 decoration-emerald-400/30 hover:decoration-emerald-300"
                                    >
                                        🔄 Resend OTP
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="mt-10 pt-6 border-t border-white/10">
                        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span>Secured with MSG91 OTP verification</span>
                        </div>
                    </div>
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
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .animate-shake { animation: shake 0.3s ease-in-out; }
            `}</style>
        </div>
    );
}
