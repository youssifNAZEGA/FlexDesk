import { useEffect } from "react";
import { getCurrentUser, db } from "@/lib/db";
import { profiles } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import Navbar from "@/components/navbar";

export default function HomePage() {
  const [user, setUser] = React.useState<{ id: string; name: string; email: string } | null>(null);
  const [rooms, setRooms] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    (async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      
      // Load rooms from database
      const allRooms = await db.select().from(profiles); // TODO: Replace with rooms query
      setRooms(allRooms);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-gray-500">Chargement des salles...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar showAuthButtons={!user} />
      
      <main className="py-24 px-6 max-w-5xl mx-auto">
        {user ? (
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Bienvenue sur FlexDesk, {user.name} !</h1>
            <p className="text-gray-600 mt-2">Réservez vos espaces de coworking</p>
          </div>
        ) : (
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900">FlexDesk</h1>
            <p className="text-gray-600">La plateforme de réservation d'espaces de coworking</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <div 
              key={room.id}
              className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow cursor-pointer overflow-hidden"
              onClick={() => alert(`Détails de la salle: ${room.first_name}`)}
            >
              <div className="h-48 bg-gradient-to-b from-blue-100 to-gray-100 flex items-end p-4">
                <span className="text-sm text-gray-400">Salle disponible</span>
              </div>
              <div className="p-4">
                <h3 className="font-medium text-gray-900">{room.first_name || "Salle"}</h3>
                <p className="text-gray-500 text-sm mb-2">{room.email || "Réserver"}</p>
                <p className="text-xs text-gray-400">Capacité: --</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}