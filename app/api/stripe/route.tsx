import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { bookings, rooms, profiles } from "@/drizzle/schema";
import { eq, and, gte, lte } from "drizzle-om";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2022-11-15",
});

// GET: Récupérer les clés Stripe publiques
export async function GET() {
  try {
    return NextResponse.json({
      publicKey: process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur lors du chargement de la clé Stripe" },
      { status: 500 }
    );
  }
}

// POST: Créer une session de checkout Stripe
export async function POST(request: Request) {
  const { roomId, startTime, endTime, userId } = await request.json();

  if (!roomId || !startTime || !endTime || !userId) {
    return NextResponse.json(
      { error: "Données manquantes pour la réservation" },
      { status: 400 }
    );
  }

  try {
    // Vérifier si la salle est disponible à la date/heure demandée
    const start = new Date(startTime);
    const end = new Date(endTime);

    // Vérifier les conflits de réservation existants
    const existingBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.roomId, Number(roomId)),
          gte(bookings.startTime, start),
          lte(bookings.endTime, end)
        )
      );

    if (existingBookings.length > 0) {
      return NextResponse.json(
        { error: "La salle n'est pas disponible à cette date/heure" },
        { status: 409 }
      );
    }

    // Calculer la durée et le prix total
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const room = await db.select().from(rooms).where(eq(rooms.id, Number(roomId))).limit(1);

    if (!room.length) {
      return NextResponse.json({ error: "Salle introuvable" }, { status: 404 });
    }

    const pricePerHour = room[0].pricePerHour;
    const totalPrice = Number(pricePerHour) * durationHours;

    // Créer la session Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Réservation: ${room[0].name}`,
              description: `Du ${start.toLocaleDateString()} au ${end.toLocaleDateString()}`,
            },
            unit_amount: Math.round(totalPrice * 100), // En centimes
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_URL}/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/salles`,
      metadata: {
        roomId: roomId.toString(),
        userId: userId.toString(),
        startTime: startTime,
        endTime: endTime,
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Erreur Stripe:", error);
    return NextResponse.json(
      { error: "Erreur interne Stripe" },
      { status: 500 }
    );
  }
}