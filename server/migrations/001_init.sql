-- Championship management portal: initial schema.
-- Dates are ISO strings: 'YYYY-MM-DD' for calendar dates, full ISO-8601 UTC for timestamps.

CREATE TABLE users (
  id            INTEGER PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  phone         TEXT,
  role          TEXT NOT NULL CHECK (role IN ('super_admin','organizer','club_manager','coach','athlete')),
  club_id       INTEGER REFERENCES clubs(id) ON DELETE SET NULL,
  athlete_id    INTEGER REFERENCES athletes(id) ON DELETE SET NULL,
  is_active     INTEGER NOT NULL DEFAULT 1,
  token_version INTEGER NOT NULL DEFAULT 0,
  last_login_at TEXT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE clubs (
  id            INTEGER PRIMARY KEY,
  name          TEXT NOT NULL,
  country       TEXT NOT NULL,
  city          TEXT NOT NULL,
  address       TEXT,
  phone         TEXT,
  email         TEXT,
  owner_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE teams (
  id              INTEGER PRIMARY KEY,
  code            TEXT NOT NULL UNIQUE,
  club_id         INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  country         TEXT NOT NULL,
  city            TEXT NOT NULL,
  head_coach_name TEXT,
  coach_phone     TEXT,
  coach_email     TEXT,
  logo_path       TEXT,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_teams_club ON teams(club_id);

CREATE TABLE coaches (
  id          INTEGER PRIMARY KEY,
  club_id     INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  team_id     INTEGER REFERENCES teams(id) ON DELETE SET NULL,
  user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  full_name   TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'assistant' CHECK (role IN ('head','assistant','manager')),
  phone       TEXT,
  email       TEXT,
  dan_grade   TEXT,
  license_no  TEXT,
  photo_path  TEXT,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_coaches_club ON coaches(club_id);

CREATE TABLE athletes (
  id           INTEGER PRIMARY KEY,
  code         TEXT NOT NULL UNIQUE,
  club_id      INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  team_id      INTEGER REFERENCES teams(id) ON DELETE SET NULL,
  coach_id     INTEGER REFERENCES coaches(id) ON DELETE SET NULL,
  full_name    TEXT NOT NULL,
  father_name  TEXT,
  dob          TEXT NOT NULL,
  gender       TEXT NOT NULL CHECK (gender IN ('male','female')),
  nationality  TEXT NOT NULL,
  id_number    TEXT,
  belt         TEXT NOT NULL,
  weight_kg    REAL,
  height_cm    REAL,
  photo_path   TEXT,
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_athletes_club ON athletes(club_id);
CREATE INDEX idx_athletes_team ON athletes(team_id);

CREATE TABLE events (
  id                       INTEGER PRIMARY KEY,
  slug                     TEXT NOT NULL UNIQUE,
  name                     TEXT NOT NULL,
  organizer                TEXT NOT NULL,
  federation               TEXT,
  summary                  TEXT,
  description              TEXT,
  rules                    TEXT,
  schedule_json            TEXT NOT NULL DEFAULT '[]',
  venue_name               TEXT,
  venue_address            TEXT,
  city                     TEXT,
  country                  TEXT,
  start_date               TEXT NOT NULL,
  end_date                 TEXT NOT NULL,
  registration_opens       TEXT,
  registration_deadline    TEXT NOT NULL,
  status_override          TEXT CHECK (status_override IN ('upcoming','registration_open','registration_closed','ongoing','completed')),
  published                INTEGER NOT NULL DEFAULT 0,
  currency                 TEXT NOT NULL DEFAULT 'PKR',
  base_fee                 REAL NOT NULL DEFAULT 0,
  age_method               TEXT NOT NULL DEFAULT 'birth_year' CHECK (age_method IN ('birth_year','exact_date')),
  age_reference_date       TEXT,
  require_medical          INTEGER NOT NULL DEFAULT 0,
  require_id_document      INTEGER NOT NULL DEFAULT 1,
  require_photo            INTEGER NOT NULL DEFAULT 1,
  allow_duplicate_entries  INTEGER NOT NULL DEFAULT 0,
  max_categories_per_athlete INTEGER,
  weight_tolerance_kg      REAL NOT NULL DEFAULT 0,
  contact_email            TEXT,
  contact_phone            TEXT,
  poster_path              TEXT,
  invitation_pdf_path      TEXT,
  rules_pdf_path           TEXT,
  created_by               INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at               TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at               TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Which organizer accounts may manage which event.
CREATE TABLE event_organizers (
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, user_id)
);

CREATE TABLE age_divisions (
  id        INTEGER PRIMARY KEY,
  event_id  INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name      TEXT NOT NULL,
  min_age   INTEGER NOT NULL,
  max_age   INTEGER NOT NULL,
  sort      INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_age_event ON age_divisions(event_id);

CREATE TABLE weight_divisions (
  id              INTEGER PRIMARY KEY,
  event_id        INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  age_division_id INTEGER NOT NULL REFERENCES age_divisions(id) ON DELETE CASCADE,
  gender          TEXT NOT NULL CHECK (gender IN ('male','female')),
  name            TEXT NOT NULL,
  min_kg          REAL,
  max_kg          REAL,
  sort            INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_weight_event ON weight_divisions(event_id);

CREATE TABLE belt_divisions (
  id         INTEGER PRIMARY KEY,
  event_id   INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  belts_json TEXT NOT NULL DEFAULT '[]',
  sort       INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_belt_event ON belt_divisions(event_id);

CREATE TABLE event_categories (
  id               INTEGER PRIMARY KEY,
  event_id         INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  discipline       TEXT NOT NULL CHECK (discipline IN ('kyorugi','poomsae','breaking','demonstration')),
  subtype          TEXT,
  format           TEXT NOT NULL DEFAULT 'individual' CHECK (format IN ('individual','pair','team')),
  gender           TEXT NOT NULL DEFAULT 'open' CHECK (gender IN ('male','female','mixed','open')),
  age_division_id  INTEGER REFERENCES age_divisions(id) ON DELETE SET NULL,
  belt_division_id INTEGER REFERENCES belt_divisions(id) ON DELETE SET NULL,
  min_members      INTEGER NOT NULL DEFAULT 1,
  max_members      INTEGER NOT NULL DEFAULT 1,
  fee              REAL,
  max_entries_per_team INTEGER,
  name             TEXT NOT NULL,
  notes            TEXT,
  active           INTEGER NOT NULL DEFAULT 1,
  sort             INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_categories_event ON event_categories(event_id);

CREATE TABLE announcements (
  id         INTEGER PRIMARY KEY,
  event_id   INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  pinned     INTEGER NOT NULL DEFAULT 0,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE registrations (
  id                 INTEGER PRIMARY KEY,
  code               TEXT NOT NULL UNIQUE,
  event_id           INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  club_id            INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  team_id            INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  category_id        INTEGER NOT NULL REFERENCES event_categories(id) ON DELETE RESTRICT,
  weight_division_id INTEGER REFERENCES weight_divisions(id) ON DELETE SET NULL,
  coach_id           INTEGER REFERENCES coaches(id) ON DELETE SET NULL,
  status             TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','under_review','approved','rejected','correction_required','cancelled')),
  fee_amount         REAL NOT NULL DEFAULT 0,
  currency           TEXT NOT NULL DEFAULT 'PKR',
  payment_status     TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','pending','paid','waived','refunded')),
  review_note        TEXT,
  club_note          TEXT,
  submitted_at       TEXT,
  reviewed_at        TEXT,
  reviewed_by        INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_by         INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_reg_event ON registrations(event_id);
CREATE INDEX idx_reg_club ON registrations(club_id);
CREATE INDEX idx_reg_category ON registrations(category_id);

-- Athletes in an entry: one for individual, two for pair, N for team.
CREATE TABLE registration_athletes (
  registration_id INTEGER NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  athlete_id      INTEGER NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  -- Snapshot at submission, so later profile edits do not rewrite history.
  weight_kg       REAL,
  belt            TEXT,
  PRIMARY KEY (registration_id, athlete_id)
);
CREATE INDEX idx_reg_athlete ON registration_athletes(athlete_id);

CREATE TABLE documents (
  id              INTEGER PRIMARY KEY,
  club_id         INTEGER REFERENCES clubs(id) ON DELETE CASCADE,
  athlete_id      INTEGER REFERENCES athletes(id) ON DELETE CASCADE,
  registration_id INTEGER REFERENCES registrations(id) ON DELETE CASCADE,
  kind            TEXT NOT NULL CHECK (kind IN ('medical','id_document','photo','certificate','payment_proof','other')),
  file_path       TEXT NOT NULL,
  original_name   TEXT NOT NULL,
  mime            TEXT NOT NULL,
  size            INTEGER NOT NULL,
  uploaded_by     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_docs_athlete ON documents(athlete_id);
CREATE INDEX idx_docs_reg ON documents(registration_id);

CREATE TABLE payments (
  id              INTEGER PRIMARY KEY,
  registration_id INTEGER NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  amount          REAL NOT NULL,
  currency        TEXT NOT NULL,
  method          TEXT NOT NULL CHECK (method IN ('cash','bank_transfer','online','waiver','other')),
  reference       TEXT,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','rejected','refunded')),
  proof_document_id INTEGER REFERENCES documents(id) ON DELETE SET NULL,
  note            TEXT,
  recorded_by     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  confirmed_by    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_payments_reg ON payments(registration_id);

CREATE TABLE notifications (
  id         INTEGER PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL DEFAULT 'info',
  title      TEXT NOT NULL,
  body       TEXT,
  link       TEXT,
  read_at    TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_notifications_user ON notifications(user_id, read_at);

CREATE TABLE audit_logs (
  id         INTEGER PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action     TEXT NOT NULL,
  entity     TEXT NOT NULL,
  entity_id  INTEGER,
  details    TEXT,
  ip         TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
