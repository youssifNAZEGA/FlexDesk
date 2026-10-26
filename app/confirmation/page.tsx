import { useEffect, useState } from "react";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { bookings, rooms, profiles } from "@/drizzle/schema";
import { eq } from "drizzle-om";

export default function ConfirmationPage() {
  const { searchParams } = new URL(window.location.href);
  const sessionId = searchParams.get("session_id");

  const [bookingConfirmed, setBookingConfirmed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!sessionId) {
        setLoading(false);
        redirect("/salles");
      }

      try {
        // Récupérer la session Stripe
        const session = await fetch(
          `https://api.stripe.com/v1/checkout/sessions/${sessionId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
            },
            // Note: En production, utilisez un endpoint serveur sécurisé
          }
        );

        const sessionData = await session.json();

        // Vérifier le statut du paiement
        if (sessionData.payment_status === "paid") {
          // Extraire les métadonnées
          const { roomId, userId, startTime, endTime } = sessionData.metadata || {};

          // Calculer le prix total et la durée
          const start = new Date(startTime);
          const end = new Date(endTime);
          const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

          // Générer un code d'accès aléatoire
          const accessCode = Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase();

          // Enregistrer la réservation en base de données
          await db
            .insert(bookings)
            .values({
              id: crypto.randomUUID(),
              userId: Number(userId),
              roomId: Number(roomId),
              startTime: start,
              endTime: end,
              accessCode: accessCode,
              status: "confirmed",
              totalPrice: Math.round(Number(pricePerHour) * durationHours * 100) / 100,
            });

          // Mettre à jour le statut de l'utilisateur si nécessaire
          // (Optionnel: could update profiles status here)

          setBookingConfirmed(true);
        } else {
          setBookingConfirmed(false);
        }
      } catch (error) {
        console.error("Erreur confirmation:", error);
        setBookingConfirmed(false);
      }

      setLoading(false);
    })();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-gray-500">Vérification du paiement...</span>
      </div>
    );
  }

  if (bookingConfirmed === true) {
    return (
      <div className="min-h-screen bg-white p-8 max-w-md mx-auto">
        <div className="bg-green-100 border-green-500 border-4 rounded-xl p-6 text-center">
          <h2 className="text-3xl font-bold text-green-800 mb-4">
            ✅ Réservation confirmée !
          </h2>
          <p className="text-green-800 mb-6">
            Votre paiement a été reçu avec succès.
          </p>
          
          <div className="bg-white p-6 rounded-md shadow-md max-w-md mx-auto">
            <h3 className="text-xl font-medium text-gray-900 mb-4">Détails de la réservation</h3>
            <p className="text-gray-600 mb-2"><strong>Salle :</strong> <span id="room-name">Chargement...</span></p>
            <p className="text-gray-600 mb-2"><strong>Date :</strong> <span id="date">Chargement...</span></p>
            <p className="text-gray-600 mb-2"><strong>Heure :</strong> <span id="time">Chargement...</span></p>
            <p className="text-gray-600 mb-2"><strong>Prix :</strong> <span id="price">Chargement...</span></p>
            <hr className="my-4" />
            <p className="text-gray-700 font-medium">
              <strong>Code d'accès :</strong> <span id="access-code" className="text-2xl font-bold text-blue-600">{accessCode}</span>
            </p>
            <p className="text-gray-500 text-sm">
              Utilisez ce code d'accès pour entrer dans la salle au moment de votre réservation.
            </p>
          </div>
          
          <div className="mt-6">
            <a href="/salles" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
              Retour au catalogue
            </a>
            <a href="/salles" className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors ml-2">
              Faire une autre réservation
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (bookingConfirmed === false) {
    return (
      <div className="min-h-screen bg-red-100 p-8 max-w-md mx-auto">
        <div className="bg-red-800 text-white rounded-xl p-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            ❌ Réservation échouée
          </h2>
          <p className="text-white mb-6">
            Nous rencontrons un problème avec votre paiement. Veuillez réessayer.
          </p>
          <a href="/salles" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
            Réessayer la réservation
          </a>
        </div>
      </div>
    );
  }

  return <div>Chargement...</div>;
}