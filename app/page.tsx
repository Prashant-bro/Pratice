import Link from "next/link";

const demos =  [
  {
    href : "/email-password",
    title : "Email + Password",
    description : "Do i have to explain it brother",
    highlights : ["Toggle Signin  / Signup  ","Show the session Panel ", "Explain the Password Rules"],
    theme : {
      card : "border  border-gray-300 rounded-lg p-4",
      title : "text-xl font-bold mb-2",
      description : "text-gray-600 mb-4",
      highlights : "list-disc list-inside text-gray-500",
      overlays : ["absolute inset-0 bg-gray-100 opacity-50 rounded-lg"],

    },
  },
  {
    href : "/google-login",
    title : "Google Signin",
    description : "Use Google to Signin",
    highlights : ["Show the Google Signin Button ", "Explain the OAuth Flow ", "Show the Session Panel"],
    theme : {
      card : "border  border-gray-300 rounded-lg p-4",
      title : "text-xl font-bold mb-2",
      description : "text-gray-600 mb-4",
      highlights : "list-disc list-inside text-gray-500",
      overlays : ["absolute inset-0 bg-gray-100 opacity-50 rounded-lg"],
    },
  }
]

export default function Home() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Supabase Auth Demos</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {demos.map((demo) => (
          <Link key={demo.href} href={demo.href} className={demo.theme.card}>
            <h2 className={demo.theme.title}>{demo.title}</h2>
            <p className={demo.theme.description}>{demo.description}</p>
            <ul className={demo.theme.highlights}>
              {demo.highlights.map((highlight, index) => (
                <li key={index}>{highlight}</li>
              ))}
            </ul>
          </Link>
        ))}
      </div>
    </div>
  );
}