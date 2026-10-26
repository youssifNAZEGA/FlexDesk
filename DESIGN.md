# FLEXDESK - DESIGN & ARCHITECTURE DU PROJET

## Aperçu du projet
**FlexDesk** est une plateforme de réservation d'espaces de coworking et de salles de réunion intégrant un chatbot d'assistance intelligent (FlexBot). L'objectif est de fournir une solution complète pour la gestion des espaces de travail partagés, incluant la réservation, le paiement et un support IA.

---

## 1. ARCHITECTURE GÉNÉRALE

### Stack Technique
- **Framework :** Next.js 14 avec App Router
- **Langage :** TypeScript (strict)
- **Style :** Tailwind CSS
- **Base de données :** Supabase (PostgreSQL)
- **Authentification :** Supabase Auth
- **Paiement :** API Stripe (mode Test)
- **Chatbot IA :** OpenAI GPT-4o-mini via Route Handlers Next.js

### Architecture des composants
```
src/
├── app/                    # Pages et routes Next.js (App Router)
├── components/            # Composants React réutilisables
│   ├── ui/                # Composants UI de base (buttons, inputs, etc.)
│   ├── layout/            # Layout (Navbar, Footer, etc.)
│   └── chat/              # Composants du widget de chat
├── lib/                   # Utilitaires et helpers
├── hooks/                 # Custom React hooks
├── types/                 # Déclarations TypeScript
└── styles/                # Styles globaux
```

---

## 2. BASE DE DONNÉES (SUPABASE)

### Tables nécessaires

#### 1. `profiles`
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  first_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);
```

#### 2. `rooms`
```sql
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  price_per_hour NUMERIC(10, 2) NOT NULL,
  equipments TEXT[] NOT NULL DEFAULT '{}',
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);
```

#### 3. `bookings`
```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  room_id UUID REFERENCES rooms(id) NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  access_code TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  total_price NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);
```

### Relations
- `profiles` ↔ `bookings` : One-to-Many (un utilisateur peut avoir plusieurs réservations)
- `rooms` ↔ `bookings` : One-to-Many (une salle peut avoir plusieurs réservations)
- Index sur `user_id`, `room_id`, `start_time`, `end_time` pour les performances

---

## 3. FLOW & PAGES PRINCIPALES

### Étape 1 : Initialisation & Base de données
- [ ] Configurer le projet Next.js 14 avec App Router
- [ ] Configurer Supabase (projet nouveau ou existant)
- [ ] Exécuter les scripts SQL ci-dessus
- [ ] Configurer Stockage Supabase pour les images des salles

### Étape 2 : Authentification & Layout
- [ ] Configurer Supabase Auth (email/phone)
- [ ] Créer la Navbar avec Tailwind CSS
- [ ] Créer le Layout commun (header, footer, sidebar)
- [ ] Protéger les routes sensibles

### Étape 3 : Catalogue des salles & Réservation
- [ ] Page d'accueil listant les salles disponibles
- [ ] Page détail d'une salle (avec galerie d'images, équipements, tarifs)
- [ ] Formulaire de sélection de date/heure
- [ ] Vérification des conflits de réservation

### Étape 4 : Tunnel de paiement (Stripe)
- [ ] Créer la route API Stripe (/api/stripe/create-checkout-session)
- [ ] Page de confirmation de paiement
- [ ] Enregistrement de la réservation en base après paiement
- [ ] Génération automatique du `access_code`

### Étape 5 : Le Chatbot d'Assistance IA
- [ ] API interne `/api/chat` recevant les messages
- [ ] Injection contexte utilisateur (réservations en cours, salles dispo)
- [ ] Composant React `<ChatWidget />` (bulle flottante en bas à droite)
- [ ] Persistance du widget sur tout le site

---

## 4. INTERFACES UTILISATEUR

### Design System (Tailwind CSS)

#### Couleurs principales
- **Primary :** Bleu/cyan (association coworking moderne)
- **Secondary :** Vert/terracotta (chaleureux)
- **Background :** Gris très clair ou blanc
- **Error :** Rouge
- **Success :** Vert

#### Typographie
- Headings : Police sans-serif, poids 600-700
- Body : Police sans-serif, taille base 1rem

#### Composants UI
1. **Navbar** :
   - Logo à gauche
   - Liens : Accueil, Réserver, Mes réservations, Chat
   - Icône utilisateur/déconnexion à droite

2. **Card Salle** :
   - Image couverture
   - Nom de la salle
   - Capacité et prix
   - Badges équipements
   - Bouton "Réserver"

3. **Widget Chat** :
   - Bulle flottante en bas à droite
   - ICône IA ou "Chat"
   - Dropdown pour ouvrir/fermer
   - Persistant sur toutes les pages

4. **Page Paiement** :
   - Résumé de la résumé
   - Formulaire Stripe Elements
   - Confirmation après paiement

---

## 5. GESTION DES ÉTATS & BONNES PRATIQUES

### Server Components vs Client Components
- **Server Components :** Données de base (liste des salles, profils), pages statiques
- **Client Components :** Formulaires, états de réservation, widget chat, interactions Stripe

### Gestion des erreurs
- Try/catch partout
- Messages d'erreur utilisateur-friendly
- Sentry ou logging pour le debug

### Loading states
- Utiliser `loading` segment route Next.js
- Squelettes d'attente pour les données asynchrones
- Spinner global pour les actions longues (paiement, IA)

### Sécurité
- Validation stricte des inputs (Zod ou React Hook Form)
- Pas de `any` en TypeScript
- CSP headers via Supabase/Next.js
- Validation côté serveur pour tous les formulaires

---

## 6. CONTEXTES POUR LE CHATBOT (FlexBot)

### Prompt système intégré
Le chatbot aura accès aux variables suivantes à chaque requête :
- `{user_authenticated}` : True/False
- `{user_first_name}` : Prénom ou "Visiteur"
- `{current_booking}` : Détails réservation active
- `{space_database}` : Liste salles avec capacités, équipements, tarifs

### Scénarios d'interaction
1. **Aide à la conversion** : Questions sur les salles → consultation DB → incitation à l'action
2. **Support technique** : Problèmes accès/WiFi/matériel → vérification réservation active → outils `regenerate_access_code` ou `escalate_to_human`
3. **Modification/Annulation** → Vérification politique d'annulation → outil `cancel_reservation`

### Contraintes de réponse
- Maximum 3 phrases par réponse
- Pas d'hallucination : si info non dans DB → "Je ne dispose pas de cette information..."
- Formatage : gras pour heures/nom/salles, listes à puces pour équipements
- Exemples few-shot pour la cohérence

---

## 7. ROADMAP D'IMPLEMENTATION

### Phase 1 (Étape 1-2) : Foundation
- [ ] Initialisation projet Next.js
- [ ] Configuration Supabase + SQL
- [ ] Authentification utilisateur
- [ ] Layoutnavbar

### Phase 2 (Étape 3) : Core Features
- [ ] Catalogue salles + système de réservation
- [ ] Formulaire date/heure
- [ ] Vérification disponibilité

### Phase 3 (Étape 4) : Payments
- [ ] Intégration Stripe
- [ ] Route API + page confirmation
- [ ] Auto-génération access_code

### Phase 4 (Étape 5) : IA Chatbot
- [ ] API `/api/chat`
- [ ] Composant ChatWidget
- [ ] Intégration contexte utilisateur
- [ ] Tests et déploiement

---

## 8. SCÉNARIOS DE TEST

### Scénario utilisateur classique
1. Utilisateur visite la page d'accueil
2. Parcourt les salles disponibles
3. Sélectionne une salle, date, heure
4. Se connecte s'il n'est pas déjà connecté
5. Proceed au paiement Stripe
6. Reçoit access_code par email/interface
7. Peut accéder à la salle avec le code
8. Interagit avec FlexBot si besoin

### Scénario chatbot
1. Utilisateur demande "La salle Matrix a-t-elle un écran ?"
2. Bot consulte `{space_database}`, répond positivement
3. Propose "Souhaitez-vous vérifier les disponibilités pour aujourd'hui ?"
4. Utilisateur confirme → redirection vers page réservation

---