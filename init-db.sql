-- ============================================================
-- FLEXDESK - Script d'initialisation PostgreSQL natif
-- ============================================================
-- Ce script crée les tables nécessaires pour la plateforme
-- de réservation d'espaces de coworking FlexDesk.
-- À exécuter via : psql "postgresql://USER:PASS@HOST:5432/flexdesk"
-- ============================================================

-- ============================================================
-- TABLE : profiles
-- Description : Profils utilisateurs
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

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

COMMENT ON TABLE rooms IS 'Table des salles disponibles sur FlexDesk';

-- Index pour la recherche de salles par capacité
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

COMMENT ON TABLE bookings IS 'Table des réservations FlexDesk';

-- Index pour les requêtes de disponibilité et période
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room_id ON bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_start_end ON bookings(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- ==========================================================--
-- FONCTIONS UTILITAIRES (triggers pour timestamps)
-- =============================================================

-- Fonction pour mettre à jour updated_at sur profiles
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

-- Fonction pour mettre à jour updated_at sur rooms
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

-- Fonction pour mettre à jour updated_at sur bookings
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
-- EXEMPLES DE DONNÉES (optionnel)
-- ============================================================

-- Exemple d'insertion de salles (décommenter si besoin)
-- INSERT INTO rooms (name, capacity, price_per_hour, equipments, image_url)
-- VALUES 
--   ('Salle Matrix', 10, 25.00, ARRAY['TV 4K', 'Tableau blanc', 'Câbles HDMI'], '/images/matrix.jpg'),
--   ('Salle Phoenix', 6, 15.00, ARRAY['Tableau blanc', 'Chaises confortables'], '/images/phoenix.jpg'),
--   ('Salle Darwin', 15, 40.00, ARRAY['Projecteur', 'Sonorisation', 'WiFi'], '/images/darwin.jpg');

-- ============================================================
-- FIN DU SCRIPT D'INITIALISATION POSTGRESQL
-- ============================================================
-- Prochainement : Intégration Next.js avec pg ou Drizzle ORM
-- ============================================================