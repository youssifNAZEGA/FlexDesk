"use client";

import { useEffect } from "react";
import { getCurrentUser } from "@/lib/session";
import { CgHome, CgSettings, CgLogout } from "react-icons/cg";
import { useRouter } from "next/navigation";

interface NavbarProps {
  showAuthButtons?: boolean;
}

export function Navbar({ showAuthButtons = true }: NavbarProps = {}) {
  const router = useRouter();
  const [user, setUser] = React.useState<{ id: string; name: string; email: string } | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    (async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setIsLoading(false);
      
      if (!currentUser) {
        router.replace("/auth/login");
      }
    })();
  }, [router]);

  if (isLoading) {
    return (
      <nav className="h-14 bg-white border-b border-gray-200">
        <div className="h-14 w-full flex items-center justify-center">
          <span className="text-gray-500">Chargement...</span>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold">FD</span>
          </div>
          <span className="text-xl font-medium text-gray-900">FlexDesk</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <a href="/" 
             className={`text-gray-500 hover:text-blue-600 transition-colors ${!user ? "font-medium" : ""}`}>
            Accueil
          </a>
          <a href="/reserver" 
             className={`text-gray-500 hover:text-blue-600 transition-colors ${!user ? "font-medium" : ""}`}>
            Réserver
          </a>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-gray-700 mr-3">{user.name}</span>
              <button
                onClick={() => {
                  // Clear session cookie
                  const cookieStore = document.cookie.split(";").forEach(c => { document.cookie = c.replace(/^+\s*/, "").split("=")[0] + "=; expires=Thu, 01 Jan 1970;path=/;domain=" + location.domain });;
                  router.push("/auth/login");
                }}
                className="text-sm text-gray-500 hover:text-red-500 transition-colors"
              >
                Déconnexion
              </button>
            </>
          ) : (
            showAuthButtons && (
              <>
                <a href="/auth/login" 
                   className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
                  Connexion
                </a>
                <a href="/auth/register" 
                   className="text-sm text-gray-500 hover:text-green-500 transition-colors ml-2">
                  Inscription
                </a>
              </>
            )
          )}
        </div>
      </div>
    </nav>
  );
}