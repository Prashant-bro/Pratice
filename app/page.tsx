import Link from "next/link";

const demos = [
  {
    href: "/phone-login",
    title: "Phone OTP",
    description: "Login with your phone number via SMS OTP",
    icon: "📱",
    highlights: [
      "6-digit OTP Input Boxes",
      "30s Resend Timer",
      "Redis + MSG91 Flow API",
    ],
    gradient: "from-emerald-500 to-cyan-500",
    glowColor: "emerald",
    badge: "Recommended",
  },
  {
    href: "/email-password",
    title: "Email + Password",
    description: "Classic email and password authentication",
    icon: "✉️",
    highlights: [
      "Toggle Signin / Signup",
      "Session Panel",
      "Password Validation",
    ],
    gradient: "from-blue-500 to-purple-500",
    glowColor: "blue",
    badge: null,
  },
  {
    href: "/google-login",
    title: "Google Sign In",
    description: "One-click social login with Google OAuth",
    icon: "🔑",
    highlights: [
      "Google OAuth Button",
      "OAuth2.0 Flow",
      "Session Panel",
    ],
    gradient: "from-orange-500 to-pink-500",
    glowColor: "orange",
    badge: null,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px] animate-pulse [animation-delay:2s]" />
        <div className="absolute bottom-[-10%] left-[30%] w-[500px] h-[500px] bg-cyan-500/8 rounded-full blur-[120px] animate-pulse [animation-delay:4s]" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 flex flex-col items-center px-4 py-16 sm:py-24">
        {/* Hero Section */}
        <header className="text-center mb-16 max-w-2xl">
          {/* Logo / Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold tracking-wider uppercase mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Diapredix Auth Platform
          </div>

          <h1 className="text-5xl sm:text-6xl font-black tracking-tight mb-4">
            <span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
              Secure
            </span>{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Authentication
            </span>
          </h1>

          <p className="text-gray-400 text-lg leading-relaxed max-w-lg mx-auto">
            AI-based diabetes risk prediction platform with enterprise-grade
            authentication. Choose your preferred sign-in method below.
          </p>
        </header>

        {/* Demo Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
          {demos.map((demo) => (
            <Link
              key={demo.href}
              href={demo.href}
              className="group relative"
            >
              {/* Glow effect on hover */}
              <div
                className={`absolute -inset-0.5 bg-gradient-to-r ${demo.gradient} rounded-2xl opacity-0 group-hover:opacity-20 blur-lg transition-all duration-500`}
              />

              {/* Card */}
              <div className="relative h-full bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-7 transition-all duration-300 group-hover:bg-white/[0.07] group-hover:border-white/[0.15] group-hover:-translate-y-1 group-hover:shadow-2xl">
                {/* Badge */}
                {demo.badge && (
                  <div className="absolute -top-2.5 right-5">
                    <span
                      className={`inline-block px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r ${demo.gradient} text-white rounded-full shadow-lg`}
                    >
                      {demo.badge}
                    </span>
                  </div>
                )}

                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${demo.gradient} flex items-center justify-center text-2xl mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                >
                  {demo.icon}
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 group-hover:bg-clip-text transition-all duration-300">
                  {demo.title}
                </h2>

                {/* Description */}
                <p className="text-gray-400 text-sm leading-relaxed mb-5">
                  {demo.description}
                </p>

                {/* Feature list */}
                <ul className="space-y-2.5 mb-6">
                  {demo.highlights.map((highlight, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-2.5 text-gray-400 text-sm"
                    >
                      <span
                        className={`w-1 h-1 rounded-full bg-gradient-to-r ${demo.gradient} flex-shrink-0`}
                      />
                      {highlight}
                    </li>
                  ))}
                </ul>

                {/* CTA Arrow */}
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 group-hover:text-white transition-colors duration-300">
                  <span>Try it out</span>
                  <svg
                    className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer / Security Badge */}
        <footer className="mt-20 text-center">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/[0.03] border border-white/[0.06]">
            <svg
              className="w-4 h-4 text-emerald-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <span className="text-xs text-gray-500">
              End-to-end encrypted &bull; Custom JWT &bull; Redis-backed OTP
              &bull; Supabase RLS
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}