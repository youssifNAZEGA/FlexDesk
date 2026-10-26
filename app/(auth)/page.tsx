import { useState } from "react";
import { db } from "@/lib/db";
import { profiles } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { createCookieSession } from "@/lib/session";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Simple authentication - in production, hash passwords!
      const user = await db
        .select()
        .from(profiles)
        .where(eq(profiles.email, email))
        .limit(1);

      if (user.length > 0 && user[0].first_name) {
        // Create session cookie
        const session = createCookieSession({
          userId: user[0].id,
          userName: user[0].first_name,
        });
        // Set cookie
        const cookieHeader = `flexdesk-session=${session}; Path=/; max-age=${60 * 60 * 24 * 30}; HttpOnly`;
        ;(e.currentTarget as HTMLFormElement).innerHTML += `<input type="hidden" name="set-cookie" value="${cookieHeader}">`;
        window.location.href = "/";
      } else {
        setError("Identifiants invalides");
      }
    } catch (err) {
      setError("Erreur lors de la connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6 text-center">Connexion FlexDesk</h2>
        
        {error && (
          <div className="bg-red-100 text-red-800 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 rounded text-white font-medium transition-colors ${loading ? "opacity-50 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
          >
            {loading ? "Connexion en cours..." : "Se connecter"}
          </button>
        </form>

        <p className="text-center text-sm mt-6">
          Nouveau sur FlexDesk ? <a href="/inscription" className="text-blue-600 hover underline">Créez un compte</a>
        </p>
      </div>
    </div>
  );
}