"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { db } from "@/lib/db";
import { rooms, bookings } from "@/drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import Navbar from "@/components/navbar";
import { getCurrentUser } from "@/lib/session";

interface RoomDetailProps {
  parameters: { id: string };
}

export default function SalleDetailPage() {
  const { id } = useParams() as { id: string };
  const [room, setRoom] = useState<any>(null);
  const [availableSlots, setAvailableSlots] = useState<{ start: string; end: string }[]>([]);
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<Date | null>(null);

  useEffect(() => {
    (async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      
      // Load room details
      const allRooms = await db.select().from(rooms);
      const foundRoom = allRooms.find((r) => r.id === id);
      setRoom(foundRoom);
      
      // Load existing bookings for availability checking
      const existingBookings = await db.select().from(bookings);
      const bookedSlots = existingBookings
        .filter((b) => b.roomId === Number(id))
        .map((b) => ({
          start: b.startTime.toISOString().split("T")[0],
          end: b.endTime.toISOString().split("T")[0],
        }));
      setAvailableSlots(bookedSlots);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-gray-500">Chargement de la salle...</span>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-white p-8">
        <h1 className="text-2xl font-bold text-gray-900">Salle non trouvée</h1>
        <p className="text-gray-600">La salle demandée n'existe pas.</p>
        <button 
          onClick={() => window.history.back()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
        >
            Retour aux salles
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar showAuthButtons={!user} />
      
      <main className="py-12 px-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">{room.name}</h2>
              <p className="text-gray-500 mb-2">Capacité: {room.capacity} personnes</p>
              <p className="text-gray-400 text-sm mb-4">
                {room.pricePerHour} €/heure
              </p>
              {room.equipments?.length > 0 && (
                <div className="mb-4">
                  <span className="font-medium text-gray-700">Équipements :</span>
                  <span className="text-gray-300">
                    {room.equipments.map((eq: string, i: number) => (
                      <span key={i} className="mr-2 text-sm">
                        {eq}
                      </span>
                    ))}
                  </span>
                </div>
              )}
              <p className="text-gray-400 text-sm">
                Disponible sur FlexDesk
              </p>
            </div>
            
            {/* Disponibilité et réservation */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Disponibilité</h3>
              
              {/* Calendar-like slot selection - simplified */}
              <div className="space-y-2">
                {availableSlots.map((slot, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 rounded hover:bg-blue-50 cursor-pointer transition-colors"
                    onClick={() => setDate(new Date(slot.start))}
                  >
                    <span className="font-medium text-gray-700">
                      {new Date(slot.start).toLocaleDateString("fr-FR")}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">- {new Date(slot.end).toLocaleDateString("fr-FR")}</span>
                  </div>
                ))}
              </div>
              
                <p className="text-gray-500 text-sm mt-2">
                  Aucune date disponible sélectionnée
                </p>
                
                {date && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-border">
                    <p className="font-medium text-gray-900">
                      Date sélectionnée : {date.toLocaleDateString("fr-FR", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}</p>
                    <p className="text-xs text-gray-400">
                      Heure à définir dans le formulaire de réservation
                    </p>
                  </div>
                )}
              
                {/* Reservation form */}
                {user && (
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (date) {
                        alert(
                          `Fonctionnalité de réservation pour ${room.name} le ${date.toLocaleDateString(
                            "fr-FR"
                          )} en cours...`
                        );
                      } else {
                        alert("Veuillez sélectionner une date disponible");
                      }
                    }}
                  >
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-gray-700 mb-1">Date</label>
                        <p className="text-gray-500 font-medium">
                          {date ? date.toLocaleDateString("fr-FR") : "Non sélectionnée"}
                        </p>
                        {/* Hidden input for the date */}
                        <input
                          type="hidden"
                          name="selectedDate"
                          value={date ? date.toISOString().split("T")[0] : ""}
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-1">Heure</label>
                        <select
                          name="timeSlot"
                          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Sélectionner une heure</option>
                          <option value="09:00">09:00 - 10:00</option>
                          <option value="10:00">10:00 - 11:00</option>
                          <option value="11:00">11:00 - 12:00</option>
                          <option value="14:00">14:00 - 15:00</option>
                          <option value="15:00">15:00 - 16:00</option>
                          <option value="16:00">16:00 - 17:00</option>
                        </select>
                      </div>
                    </div>
                    
                    <button
                      type="submit"
                      className="w-full py-3 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-lg font-medium"
                    >
                      Réserver cette salle
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}