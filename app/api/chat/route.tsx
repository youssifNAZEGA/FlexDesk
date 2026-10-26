import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookings, rooms, profiles } from "@/drizzle/schema";
import { eq, and, gte, lte } from "drizzle-om";
import OpenAI from "openai";

// Initialisation OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// Helper: Obtenir l'utilisateur actuel depuis la session
async function getCurrentUserFromSession() {
  try {
    const cookieStore = new (await import("next/headers")).Cookies();
    const sessionId = cookieStore.get("flexdesk-session")?.value;

    if (!sessionId) return null;

    const [userId] = sessionId.split("-");
    if (!userId) return null;

    const user = await db
      .select({ id: profiles.id, firstName: profiles.first_name })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    return user.length > 0 ? user[0] : null;
  } catch (error) {
    console.error("Erreur récupération utilisateur:", error);
    return null;
  }
}

// Helper: Obtenir les réservations actives de l'utilisateur
async function getUserActiveBookings(userId: string) {
  try {
    const now = new Date();

    const activeBookings = await db
      .select({
        id: bookings.id,
        roomId: bookings.roomId,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        accessCode: bookings.accessCode,
        roomName: rooms.name,
        roomCapacity: rooms.capacity,
      })
      .from(bookings)
      .leftJoin(rooms, eq(bookings.roomId, rooms.id))
      .where(
        and(
          eq(bookings.userId, userId),
          gte(bookings.endTime, now),
          eq(bookings.status, "confirmed")
        )
      );

    return activeBookings;
  } catch (error) {
    console.error("Erreur récupération réservations:", error);
    return [];
  }
}

// Helper: Obtenir les salles disponibles (non réservées actuellement)
async function getAvailableRooms() {
  try {
    const now = new Date();

    // Récupérer toutes les salles
    const allRooms = await db.select().from(rooms);

    // Récupérer les réservations actives actuelles
    const activeBookings = await db
      .select({ roomId: bookings.roomId })
      .from(bookings)
      .where(
        and(
          gte(bookings.endTime, now),
          eq(bookings.status, "confirmed")
        )
      );

    const bookedRoomIds = activeBookings.map((b) => b.roomId);

    // Retourner les salles qui ne sont pas actuellement réservées
    return allRooms.filter((room) => !bookedRoomIds.includes(room.id));
  } catch (error) {
    console.error("Erreur récupération salles disponibles:", error);
    return [];
  }
}

// POST: Gérer les messages du chatbot
export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message requis" },
        { status: 400 }
      );
    }

    // Récupérer l'utilisateur actuel
    const user = await getCurrentUserFromSession();
    const userId = user?.id || "";

    // Récupérer le contexte : réservations actives et salles dispo
    const activeBookings = userId ? await getUserActiveBookings(userId) : [];
    const availableRooms = await getAvailableRooms();

    // Préparer le contexte utilisateur pour le prompt système
    let userContext = "";
    if (user) {
      userContext += `\n---\nUTILISATEUR ACTUEL :\n`;
      userContext += `- Prénom: ${user.firstName}`;
      userContext += `\n- ID: ${user.id}`;
      if (activeBookings.length > 0) {
        userContext += `\n---\nRESERVATIONS EN COURS :`;
        activeBookings.forEach((booking) => {
          const start = booking.startTime.toISOString().split("T")[0];
          const end = booking.endTime.toISOString().split("T")[0];
          userContext += `\n  • Salle ${booking.roomName} (${booking.roomCapacity} pers.)`;
          userContext += `\n    Du: ${start} au ${end}`;
        });
      } else {
        userContext += `\n  Aucune réservation en cours`;
      }
    }

    // Contexte sur les salles disponibles
    userContext += `\n---\nINFORMATIONS SUR LES SALLES DISPONIBLES :`;
    if (availableRooms.length > 0) {
      userContext += `\n${availableRooms
        .slice(0, 5) // Limiter à 5 salles pour ne pas surcharger le prompt
        .map(
          (room) =>
            `- ${room.name} (${room.capacity} places) - ${room.pricePerHour}€/heure - Équipements: ${room.equipments?.join(", ") || "Non listed"}`
        )
        .join("\n")}`
    } else {
      userContext += `\n Aucune salle n'est actuellement disponible en temps réel.`;
    }

    userContext += `\n---\nDONNÉES DE LA BASE DE DONNÉES :`;
    userContext += `\n• Système: FlexDesk - Plateforme de réservation d'espaces de coworking`;
    userContext += `\n• Objectif: Aider l'utilisateur avec ses réservations, informations sur les salles, support technique`;

    // Construire le message pour OpenAI
    const systemPrompt = `
Tu es FlexBot, l'assistant IA officiel de FlexDesk, une plateforme de réservation d'espaces de coworking et de salles de réunion.

${userContext}

DIRECTIVES DE RÉPONSE (STRICTES) :
1. **Brièveté :** Ne fais jamais de paragraphes de plus de 3 phrases. Les utilisateurs sur mobile ou pressés doivent lire l'essentiel d'un coup d'œil.
2. **Pas d'invention (No Hallucination) :** Si un utilisateur te demande une information qui n'est pas dans le contexte ci-dessus (ex: "Y a-t-il des places de parking gratuites autour ?"), réponds : "Je ne dispose pas de cette information pour le moment. Laissez-moi passer le relais à un membre de l'équipe."
3. **Formatage :** Utilise le **gras** pour mettre en valeur les heures, les noms de salles ou les codes d'accès. Utilise des listes à puces pour l'énumération d'équipements.
4. **Ton :** Professionnel, chaleureux, concis et orienté solution.

RÈGLE IMPORTANTE : Réponds TOUJOURS en français.

Exemple de réponse courte et efficace :
"Oui ! La salle **Matrix** est équipée d'un écran TV 4K de 65 pouces avec câbles HDMI. Elle peut accueillir jusqu'à 10 personnes. Souhaitez-vous vérifier les disponibilités pour aujourd'hui ?
`;

USER MESSAGE : ${message}

RÉPONDRE MAINTENANT (maximum 3 phrases) :
`;

    // Appeler OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const reply = completion.choices[0]?.message?.content || "Désolé, je ne peux pas répondre pour le moment.";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Erreur chatbot:", error);
    return NextResponse.json(
      { error: "Erreur interne du chatbot" },
      { status: 500 }
    );
  }
}