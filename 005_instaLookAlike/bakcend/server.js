/**
 * InstaLookAlike Backend Server
 * 
 * Dit is de hoofdserver voor de InstaLookAlike applicatie, een Instagram-achtige social media platform.
 * De server is gebouwd met Express.js en gebruikt SQLite als database.
 * 
 * Belangrijkste functionaliteiten:
 * 1. Gebruikersbeheer (registratie, login, profielbeheer)
 * 2. Post management (creëren, bekijken, liken, commentaar)
 * 3. Sociale interacties (volgen, likes, comments)
 * 4. Bestandsupload voor afbeeldingen
 * 5. JWT-gebaseerde authenticatie
 * 
 * Database structuur:
 * - users: Gebruikersinformatie en authenticatie
 * - posts: Gebruikersposts met afbeeldingen en beschrijvingen
 * - likes: Like-relaties tussen gebruikers en posts
 * - comments: Reacties op posts
 * - follows: Volg-relaties tussen gebruikers
 */

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const db = require("./db");

const app = express();
app.use(express.json());
app.use(cors());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Request body:', req.body);
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: "Er is een fout opgetreden",
    details: err.message 
  });
});

// Zorg ervoor dat de "uploads" map bestaat
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Statische bestanden serveren vanuit de 'uploads' map
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes importeren
const { router: authRouter } = require('./routes/auth');
const postsRouter = require('./routes/posts');
const usersRouter = require('./routes/users');

// Routes gebruiken
app.use('/api', authRouter);
app.use('/api/posts', postsRouter);
app.use('/api/users', usersRouter);

/**
 * Functie voor het aanmaken van de database tabellen
 * Deze functie wordt uitgevoerd bij het opstarten van de server
 * Maakt gebruik van SQLite's serialize functie om queries in volgorde uit te voeren
 */
function createTables() {
  db.serialize(() => {
    // Foreign keys inschakelen voor referentiële integriteit
    db.run("PRAGMA foreign_keys = ON");

    /**
     * Users tabel
     * Bevat alle gebruikersinformatie:
     * - id: Unieke identifier
     * - username: Unieke gebruikersnaam
     * - email: Uniek emailadres
     * - password: Gehashte wachtwoord
     * - profile_picture: Pad naar profielfoto
     * - bio: Gebruikersbeschrijving
     * - created_at: Registratiedatum
     */
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      profile_picture TEXT,
      bio TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    /**
     * Posts tabel
     * Bevat alle posts van gebruikers:
     * - id: Unieke identifier
     * - user_id: Referentie naar de gebruiker
     * - image_url: Pad naar de post afbeelding
     * - caption: Beschrijving van de post
     * - created_at: Publicatiedatum
     */
    db.run(`CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      caption TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);

    /**
     * Likes tabel
     * Houdt bij welke gebruikers welke posts hebben geliked:
     * - id: Unieke identifier
     * - user_id: Referentie naar de gebruiker
     * - post_id: Referentie naar de post
     * - created_at: Datum van de like
     */
    db.run(`CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      post_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      UNIQUE(user_id, post_id)
    )`);

    /**
     * Comments tabel
     * Bevat alle reacties op posts:
     * - id: Unieke identifier
     * - user_id: Referentie naar de gebruiker
     * - post_id: Referentie naar de post
     * - content: Inhoud van de reactie
     * - created_at: Datum van de reactie
     */
    db.run(`CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      post_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    )`);

    /**
     * Follows tabel
     * Houdt bij welke gebruikers elkaar volgen:
     * - id: Unieke identifier
     * - follower_id: Referentie naar de volger
     * - following_id: Referentie naar de gevolgde gebruiker
     * - created_at: Datum van het volgen
     */
    db.run(`CREATE TABLE IF NOT EXISTS follows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      follower_id INTEGER NOT NULL,
      following_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(follower_id, following_id)
    )`);
  });
}

// Database initialiseren en tabellen aanmaken
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", (err, row) => {
  if (err) {
    console.error('Error checking database tables:', err);
  } else if (!row) {
    createTables();
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
