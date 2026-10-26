-- ============================================================
-- FLEXDESK - Script d'initialisation Supabase (PostgreSQL)
-- ============================================================
-- Ce script crée les tables nécessaires pour la plateforme
-- de réservation d'espaces de coworking FlexDesk.
--
-- Exécutez ce script dans l'interface SQL Editor de Supabase
-- ou via l'CLI : supabase db execute --file init.sql
-- ============================================================

-- 1. Activation de l'extension UUID pour générer des IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE : profiles
-- Description : Profils utilisateurs (étendu depuis auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- Commentaire sur la table
COMMENT ON TABLE profiles IS 'Table des profils utilisateurs de FlexDesk';

-- Index pour les recherches par email
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- ============================================================
-- TABLE : rooms
-- Description : Salles de coworking et salles de réunion
-- ============================================================
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  price_per_hour NUMERIC(10, 2) NOT NULL,
  equipments TEXT[] NOT NULL DEFAULT '{}',
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- Commentaire sur la table
COMMENT ON TABLE rooms IS 'Table des salles disponibles sur FlexDesk';

-- Index pour la recherche de salles par capacité ou équipement
CREATE INDEX IF NOT EXISTS idx_rooms_name ON rooms(name);
CREATE INDEX IF NOT EXISTS idx_rooms_capacity ON rooms(capacity);

-- ============================================================
-- TABLE : bookings
-- Description : Réservations effectuées par les utilisateurs
-- ============================================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  access_code TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  total_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- Commentaire sur la table
COMMENT ON TABLE bookings IS 'Table des réservations FlexDesk';

-- Index pour les requêtes de disponibilité et période
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room_id ON bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_start_end ON bookings(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- ============================================================
-- POLICIES & SECURITY
-- ============================================================

-- Activer Row Level Security (RLS) sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Policies pour profiles (les utilisateurs peuvent voir leur propre profil)
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Policies pour rooms (tous les utilisateurs peuvent voir les salles actives)
CREATE POLICY "Everyone can view rooms" ON rooms
  FOR SELECT USING (true);

-- Policies pour bookings (selon le statut d'authentification)
CREATE POLICY "Authenticated users can create bookings" ON bookings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICy "Users can view own bookings" ON bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings" ON bookings
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- TRIGGERS POUR LES TIMESTAMPS
-- ============================================================

-- Create updated_at trigger for profiles
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at_trigger
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_profiles_updated_at();

-- Create updated_at trigger for rooms
CREATE OR REPLACE FUNCTION update_rooms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rooms_updated_at_trigger
BEFORE UPDATE ON rooms
FOR EACH ROW EXECUTE FUNCTION update_rooms_updated_at();

-- Create updated_at trigger for bookings
CREATE OR REPLACE FUNCTION update_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bookings_updated_at_trigger
BEFORE UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION update_bookings_updated_at();

-- ============================================================
-- EXEMPLES DE DONNÉES (optionnel - à commenter si non nécessaires)
-- ============================================================

-- Exemple d'insertion de salles (décommenter si besoin)
-- INSERT INTO rooms (name, capacity, price_per_hour, equipments, image_url)
-- VALUES 
--   ('Salle Matrix', 10, 25.00, ARRAY['TV 4K', 'Tableau blanc', 'Câbles HDMI'], '/images/matrix.jpg'),
--   ('Salle Phoenix', 6, 15.00, ARRAY['Tableau blanc', 'Chaises confortables'], '/images/phoenix.jpg'),
--   ('Salle Darwin', 15, 40.00, ARRAY['Projecteur', 'Sonorisation', 'WiFi'], '/images/darwin.jpg');

-- ============================================================
-- FIN DU SCRIPT D'INITIALISATION
-- ============================================================
-- Prochainement : Étape 2 - Authentification & Layout
-- ============================================================