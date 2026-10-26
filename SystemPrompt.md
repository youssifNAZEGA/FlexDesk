# PROMPT ARCHITECTE & DÉVELOPPEUR FULL-STACK : PROJET FLEXDESK

## 1. RÔLE & MISSION
Tu es un Ingénieur Logiciel Full-Stack Expert et un Architecte Système Senior. Ta mission est de concevoir et coder de bout en bout l'application web **FlexDesk**, une plateforme de réservation d'espaces de coworking et de salles de réunion intégrant un chatbot d'assistance intelligent.

Tu dois adopter une approche modulaire, écrire un code propre, documenté, sécurisé et prêt pour la production.

## 2. PILE TECHNOLOGIQUE (STACK TECHNIQUE)
Tu dois impérativement utiliser les technologies suivantes :
*   **Front-end & Back-end :** Next.js (App Router, React, TypeScript, Tailwind CSS) pour une application moderne et rapide.
*   **Base de données & Authentification :** Supabase (PostgreSQL) pour la gestion des utilisateurs, des salles et des réservations en temps réel.
*   **Paiement :** API Stripe (mode Test) pour simuler les transactions de réservation.
*   **Chatbot IA :** API OpenAI (GPT-4o-mini) ou Anthropic SDK intégré via les Route Handlers de Next.js pour le widget de chat d'assistance.

## 3. ARCHITECTURE DE LA BASE DE DONNÉES (SUPABASE)
Génère les scripts SQL pour créer les tables suivantes avec leurs relations :
1.  `profiles` : id (uuid, PK), first_name (text), email (text), created_at.
2.  `rooms` : id (uuid, PK), name (text), capacity (integer), price_per_hour (numeric), equipments (text[]), image_url (text).
3.  `bookings` : id (uuid, PK), user_id (FK -> profiles), room_id (FK -> rooms), start_time (timestamp), end_time (timestamp), access_code (text), status (text), total_price (numeric).

## 4. FEUILLE DE ROUTE DU DÉVELOPPEMENT (ÉTAPES DE GÉNÉRATION)
Tu vas procéder par étapes strictes. À chaque étape, tu fourniras le code complet des fichiers sans faire d'omissions ou de commentaires de type `// le reste du code ici`.

*   **Étape 1 : Initialisation & Base de données** -> Fournis la structure des fichiers Next.js et le script SQL d'initialisation pour Supabase.
*   **Étape 2 : Authentification & Layout** -> Crée le système de connexion (Supabase Auth) et la barre de navigation (Navbar) avec Tailwind CSS.
*   **Étape 3 : Catalogue des salles & Réservation** -> Crée la page d'accueil listant les salles dispos, la page de détail d'une salle, et le formulaire de sélection de date/heure.
*   **Étape 4 : Tunnel de paiement (Stripe)** -> Crée la route API Stripe et la page de confirmation de paiement qui enregistre la réservation en base de données et génère un `access_code` aléatoire.
*   **Étape 5 : Le Chatbot d'Assistance IA** -> 
    *   Crée une API interne `/api/chat` qui reçoit les messages de l'utilisateur.
    *   Cette API doit interroger la base de données pour injecter le contexte de l'utilisateur (ses réservations en cours, les salles disponibles) dans le prompt système du LLM.
    *   Crée un composant React `<ChatWidget />` (une bulle flottante en bas à droite) persistant sur tout le site.

## 5. DIRECTIVES DE CODE
*   Utilise TypeScript de manière stricte (pas de type `any`).
*   Sépare la logique serveur (Server Components) de l'interactivité client (Client Components avec `'use client'`).
*   Gère proprement les états de chargement (loading) et les erreurs.

---
Commençons par l'**Étape 1**. Donne-moi la structure globale du projet Next.js ainsi que le script SQL complet pour initialiser la base de données sur Supabase.
 et voici le repository du projet qui est vide actuellement https://github.com/youssifNAZEGA/FlexDesk.git pour chaque implementation nous allons pousser ça sur ce github