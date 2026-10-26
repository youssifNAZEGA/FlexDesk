"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/db";
import { profiles, rooms, bookings } from "@/drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import Navbar from "@/components/navbar";
import { getCurrentUser } from "@/lib/session";

export default function SallesPage() {
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{
    capacity?: number;
    search?: string;
  }>({});

  useEffect(() => {
    (async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      
      // Load rooms from database
      const allRooms = await db.select().from(rooms);
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

  // Filter rooms based on criteria
  const availableRooms = rooms.filter((room) => {
    // Search by name
    if (filter.search && !room.name.toLowerCase().includes(filter.search.toLowerCase())) {
      return false;
    }
    // Filter by capacity
    if (filter.capacity && room.capacity < filter.capacity) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar showAuthButtons={!user} />
      
      <main className="py-12 px-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Catalogue des Salles</h1>
          <p className="text-gray-600">Réservez votre espace de travail</p>
          
          {/* Filtres */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-gray-700 mb-1">Rechercher</label>
              <input
                type="text"
                placeholder="Nom de la salle..."
                value={filter.search || ""}
                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1">Capacité minimum</label>
              <input
                type="number"
                placeholder="Ex: 10"
                value={filter.capacity || ""}
                onChange={(e) => setFilter({ ...filter, capacity: e.target ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <button
                onClick={() => setFilter({})}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>

        {/* Liste des salles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableRooms.map((room) => (
            <div 
              key={room.id}
              className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => alert(`Détails: ${room.name}`)}
            >
              {/* Image ou placeholder */}
              <div className="h-48 bg-blue-500 flex items-center justify-center">
                <span className="text-2xl text-white">{room.name?.substring(0, 2) || "S"}</span>
              </div>
              
              <div className="p-5">
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {room.name}
                </h3>
                <p className="text-gray-500 text-sm mb-2">
                  {room.capacity} personnes
                </p>
                <p className="text-gray-400 text-xs mb-3">
                  {room.equipments?.length > 0 ? 
                    `Équipements: ${room.equipments.slice(0, 3).join(", ")}` : 
                    "Aucun équipement listed"
                  }
                </p>
                <p className="text-gray-300 text-xs">
                  {room.pricePerHour} €/heure
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Section réservations */}
        {user && (
          <div className="mt-8 p-6 bg-white rounded-2xl shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Réserver une salle</h2>
            <p className="text-gray-600 mb-4">
              Veuillez sélectionner une salle ci-dessus, puis choisir une date et heure.
            </p>
            {/* TODO: Add reservation form here */}
            <button 
              onClick={() => alert("Fonctionnalité de réservation en cours de développement")}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-lg font-medium"
            >
              Je veux réserver
            </button>
          </div>
        )}
      </main>
    </div>
  );
}