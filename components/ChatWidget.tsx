"use client";

import { useState, useEffect, useCallback } from "react";
import { getCurrentUser } from "@/lib/session";
import { io } from "socket.io-client";
import { FaChatDots } from "react-icons/fa";

// Styles inline pour le widget flottant
const widgetStyles = {
  position: "fixed" as "fixed",
  bottom: "20px" as "20px",
  right: "20px" as "20px",
  zIndex: "9999",
  fontFamily: "'Inter', 'Sans-Serif'",
};

const bubbleStyles = {
  width: "60px",
  height: "60px",
  background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(99, 102, 241, 0.4)",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
};

const expandedStyles = {
  position: "fixed" as "fixed",
  bottom: "80px" as "80px",
  right: "20px" as "20px",
  zIndex: "9999",
  width: "320px",
  background: "white",
  borderRadius: "12px",
  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
  overflow: "hidden",
  animation: "slideIn 0.3s ease-out",
};

const headerStyles = {
  padding: "15px 20px",
  borderBottom: "1px solid #e5e7eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  background: "f8fafc",
};

const closeButtonStyles = {
  background: "none",
  border: "none",
  color: "#6b7280",
  fontSize: "18px",
  cursor: "pointer",
  padding: "0",
};

const messagesContainerStyles = {
  height: "400px",
  padding: "20px",
  overflowY: "auto",
  background: "f8fafc",
};

const inputContainerStyles = {
  padding: "15px 20px",
  borderTop: "1px solid #e5e7eb",
  display: "flex",
  gap: "10",
};

const inputStyles = {
  flex: "1",
  padding: "10px 15px",
  border: "1px solid #d1d5db",
  borderRadius: "20px",
  outline: "none",
  fontSize: "14px",
};

const sendButtonStyles = {
  background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
  border: "none",
  color: "white",
  padding: "0 20px",
  borderRadius: "20px",
  cursor: "pointer",
  fontWeight: "500",
  transition: "background 0.2s",
};

const welcomeMessage = "Bonjour ! Je m'appelle FlexBot. Je peux t'aider à réserver une salle, vérifier tes réservations en cours ou répondre à vos questions sur les espaces FlexDesk. Que puis-je faire pour toi ?";

export function ChatWidget() {
  const [messages, setMessages] = useState<{ id: string; content: string; sender: "user" | "bot" }[]>([]);
  const [input, setInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);

  // Se connecter à l'utilisateur
  useEffect(() => {
    (async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    })();
  }, []);

  // Initialiser avec le message de bienvenue
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ id: "1", content: welcomeMessage, sender: "bot" }]);
    }
  }, [messages.length]);

  // Gérer l'envoi de message
  const handleSend = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    // Ajouter le message utilisateur
    setMessages((prev) => [
      ...prev,
      { id: String(Date.now()), content: trimmed, sender: "user" },
    ]);
    setInput("");

    // Appeler l'API du chatbot
    try {
      setIsTyping(true);
      const response = await fetch("http://localhost:3000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: trimmed }),
      });

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { id: String(Date.now() + 1), content: data.reply || "Désolé", sender: "bot" },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { id: String(Date.now() + 1), content: "Désolé, erreur connexion", sender: "bot" },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, []);

  return (
    <div>
      {/* Bulle flottante */}
      <div
        {...bubbleStyles}
        onClick={() => {
          // Toggle entre l'état compact et étendu
          // Pour simplifier, on reste en état compact mais pourrait ouvrir un modal
        }}
        style={{ ...widgetStyles, ...bubbleStyles }},
      >
        <FaChatDots className="text-white text-2xl" />
      </div>

      {/* Panel étendu (caché par défaut pour simplifier) */}
      <div
        {...expandedStyles}
        style={{ ...widgetStyles, ...expandedStyles, display: "block" }}
      >
        <div {...headerStyles}>
          <span>
            <strong>FlexBot</strong> - Assistance IA
          </span>
          <button
            {...closeButtonStyles}
            onClick={() => {
              // Cacher le panel (pour simplifier, on remet en état compact)
              // Dans une implémentation complète, on gérerait l'état d'affichage
            }}
          >
            ✕
          </button>
        </div>

        <div {...messagesContainerStyles}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                marginBottom: "15px",
                maxWidth: "80%",
                marginLeft: msg.sender === "user" ? "auto" : "0",
                marginRight: msg.sender === "user" ? "0" : "auto",
              }}
            >
              <p
                style={{
                  padding: "10px 15px",
                  borderRadius: "12px",
                  background: msg.sender === "user" ? "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)" : "white",
                  color: msg.sender === "user" ? "white" : "#1f2937",
                  fontSize: "14px",
                  lineHeight: "1.4",
                }}
              >
                {msg.content}
              </p>
            </div>
          ))}

          {isTyping && (
            <div style={{ padding: "10px", color: "#6b7280", fontSize: "12px" }}>
              FlexBot tape...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}