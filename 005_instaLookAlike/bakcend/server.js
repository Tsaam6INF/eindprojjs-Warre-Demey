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
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(cors());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: "Er is een fout opgetreden",
    details: err.message 
  });
});

// Multer configuratie voor bestand-upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "uploads";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error("Alleen afbeeldingen zijn toegestaan!"), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limiet
  },
});

// Zorg ervoor dat de "uploads" map bestaat
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Statische bestanden serveren vanuit de 'uploads' map
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/**
 * Database configuratie en initialisatie
 * Maakt verbinding met SQLite database en initialiseert de tabellen
 */
const db = new sqlite3.Database("db.sqlite3", (err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Connected to the SQLite database.');
    createTables();
  }
});

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
    )`, (err) => {
      if (err) {
        console.error('Error creating users table:', err);
      } else {
        console.log('Users table ready');
      }
    });

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
    )`, (err) => {
      if (err) {
        console.error('Error creating posts table:', err);
      } else {
        console.log('Posts table ready');
      }
    });

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
    )`, (err) => {
      if (err) {
        console.error('Error creating likes table:', err);
      } else {
        console.log('Likes table ready');
      }
    });

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
    )`, (err) => {
      if (err) {
        console.error('Error creating comments table:', err);
      } else {
        console.log('Comments table ready');
      }
    });

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
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(follower_id, following_id)
    )`, (err) => {
      if (err) {
        console.error('Error creating follows table:', err);
      } else {
        console.log('Follows table ready');
      }
    });
  });
}

/**
 * Authenticatie Middleware
 * Verifieert JWT tokens voor beschermde routes
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * 
 * De middleware:
 * 1. Haalt de JWT token uit de Authorization header
 * 2. Verifieert de token met de geheime sleutel
 * 3. Voegt de gebruikersinformatie toe aan het request object
 * 4. Geeft een 401 of 403 error als authenticatie faalt
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  jwt.verify(token, 'your_jwt_secret', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

/**
 * Registratie Route
 * Endpoint: POST /api/register
 * 
 * Verwerkt nieuwe gebruikersregistraties:
 * 1. Valideert de input (username, email, password)
 * 2. Controleert of de gebruiker al bestaat
 * 3. Hasht het wachtwoord met bcrypt
 * 4. Maakt een nieuwe gebruiker aan in de database
 * 5. Genereert een JWT token voor de nieuwe gebruiker
 * 
 * @param {Object} req.body - Bevat username, email en password
 * @returns {Object} JWT token en gebruikersinformatie
 */
app.post("/api/register", async (req, res) => {
  console.log('Register request received:', req.body);
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    console.log('Missing username, email, or password');
    return res.status(400).json({ error: "Username, email, and password are required!" });
  }

  try {
    // Controleer eerst of de gebruiker al bestaat
    db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, email], async (err, row) => {
      if (err) {
        console.error('Error checking existing user:', err);
        return res.status(500).json({ error: "Database error bij het controleren van gebruikersnaam of email" });
      }

      if (row) {
        console.log('Username or email already exists:', username || email);
        return res.status(400).json({ error: "Deze gebruikersnaam of email bestaat al" });
      }

      try {
        // Versleutelen van het wachtwoord met bcrypt
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('Password hashed successfully');

        db.run(
          `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`,
          [username, email, hashedPassword],
          function (err) {
            if (err) {
              console.error("Database error during registration:", err);
              return res.status(500).json({ error: "Fout bij registratie", details: err.message });
            }
            console.log('User registered successfully:', username);
            const token = jwt.sign({ id: this.lastID, username }, 'your_jwt_secret');
            res.status(201).json({
              token,
              id: this.lastID,
              username: username
            });
          }
        );
      } catch (error) {
        console.error('Error during password hashing:', error);
        res.status(500).json({ error: "Fout bij het versleutelen van het wachtwoord" });
      }
    });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: "Fout bij registratie", details: error.message });
  }
});

/**
 * Login Route
 * Endpoint: POST /api/login
 * 
 * Verwerkt gebruikerslogin:
 * 1. Valideert de input (email, password)
 * 2. Zoekt de gebruiker in de database
 * 3. Verifieert het wachtwoord met bcrypt
 * 4. Genereert een JWT token voor de ingelogde gebruiker
 * 
 * @param {Object} req.body - Bevat email en password
 * @returns {Object} JWT token en gebruikersinformatie
 */
app.post("/api/login", (req, res) => {
  console.log('Login request received:', req.body);
  const { email, password } = req.body;

  db.get(
    `SELECT * FROM users WHERE email = ?`,
    [email],
    async (err, user) => {
      if (err) {
        console.error('Database error during login:', err);
        return res.status(500).json({ error: "Database error" });
      }
      if (!user) {
        console.log('Invalid email or password');
        return res.status(401).json({ error: "Invalid email or password" });
      }

      try {
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
          console.log('Invalid email or password');
          return res.status(401).json({ error: "Invalid email or password" });
        }

        console.log('User logged in successfully');
        const token = jwt.sign({ id: user.id, username: user.username }, 'your_jwt_secret');
        res.json({
          token,
          id: user.id,
          username: user.username
        });
      } catch (error) {
        console.error('Error validating password:', error);
        res.status(500).json({ error: "Error validating password" });
      }
    }
  );
});

// Nieuwe post (met bestand-upload)
app.post("/api/posts", upload.single("image"), (req, res) => {
  const { caption, user_id } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;

  if (!image_url) {
    return res.status(400).json({ error: "Afbeelding is verplicht" });
  }

  if (!user_id) {
    return res.status(400).json({ error: "Gebruiker ID is verplicht" });
  }

  // Controleer eerst of de gebruiker bestaat
  db.get('SELECT id FROM users WHERE id = ?', [user_id], (err, user) => {
    if (err) {
      console.error("Error checking user:", err);
      return res.status(500).json({ error: "Database error bij het controleren van gebruiker" });
    }

    if (!user) {
      return res.status(404).json({ error: "Gebruiker niet gevonden" });
    }

    const sql = `
      INSERT INTO posts (user_id, caption, image_url)
      VALUES (?, ?, ?)
    `;

    db.run(sql, [user_id, caption, image_url], function (err) {
      if (err) {
        console.error("Error creating post:", err);
        return res.status(500).json({ error: "Er is een fout opgetreden bij het maken van de post" });
      }

      res.json({
        id: this.lastID,
        user_id,
        caption,
        image_url,
      });
    });
  });
});

app.get("/api/posts", (req, res) => {
  console.log('Fetching posts...');
  
  db.all(
    `SELECT p.*, u.username,
     (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
     (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
     (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ?) as is_liked
     FROM posts p
     LEFT JOIN users u ON p.user_id = u.id
     ORDER BY p.id DESC`,
    [req.query.userId || 0],
    (err, posts) => {
      if (err) {
        console.error('Error fetching posts:', err);
        return res.status(500).json({ error: "Database error bij het ophalen van posts" });
      }

      // Haal comments op voor elke post
      const postsWithComments = posts.map(post => ({
        ...post,
        comments: []
      }));

      // Haal comments op voor elke post
      const postIds = posts.map(post => post.id);
      if (postIds.length > 0) {
        db.all(
          `SELECT c.*, u.username
           FROM comments c
           JOIN users u ON c.user_id = u.id
           WHERE c.post_id IN (${postIds.join(',')})
           ORDER BY c.id ASC`,
          (err, comments) => {
            if (err) {
              console.error('Error fetching comments:', err);
              return res.status(500).json({ error: "Database error bij het ophalen van comments" });
            }

            // Voeg comments toe aan de juiste posts
            comments.forEach(comment => {
              const post = postsWithComments.find(p => p.id === comment.post_id);
              if (post) {
                post.comments.push(comment);
              }
            });

            res.json(postsWithComments);
          }
        );
      } else {
        res.json(postsWithComments);
      }
    }
  );
});

// Like een post
app.post("/api/posts/:postId/like", (req, res) => {
  const { postId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Gebruiker ID is vereist" });
  }

  // Controleer eerst of de post bestaat
  db.get("SELECT id FROM posts WHERE id = ?", [postId], (err, post) => {
    if (err) {
      console.error('Error checking post:', err);
      return res.status(500).json({ error: "Database error bij het controleren van post" });
    }
    if (!post) {
      return res.status(404).json({ error: "Post niet gevonden" });
    }

    // Controleer of de gebruiker de post al heeft geliked
    db.get("SELECT id FROM likes WHERE post_id = ? AND user_id = ?", [postId, userId], (err, like) => {
      if (err) {
        console.error('Error checking like:', err);
        return res.status(500).json({ error: "Database error bij het controleren van like" });
      }

      if (like) {
        // Als de post al geliked is, verwijder de like (unlike)
        db.run("DELETE FROM likes WHERE post_id = ? AND user_id = ?", [postId, userId], function(err) {
          if (err) {
            console.error('Error removing like:', err);
            return res.status(500).json({ error: "Database error bij het verwijderen van like" });
          }
          res.json({ message: "Like succesvol verwijderd", action: "unliked" });
        });
      } else {
        // Als de post nog niet geliked is, voeg de like toe
        db.run("INSERT INTO likes (post_id, user_id) VALUES (?, ?)", [postId, userId], function(err) {
          if (err) {
            console.error('Error adding like:', err);
            return res.status(500).json({ error: "Database error bij het toevoegen van like" });
          }
          res.json({ message: "Post succesvol geliked", action: "liked" });
        });
      }
    });
  });
});

// Unlike een post
app.delete("/api/posts/:postId/like", (req, res) => {
  const { postId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Gebruiker ID is vereist" });
  }

  // Controleer eerst of de post bestaat
  db.get("SELECT id FROM posts WHERE id = ?", [postId], (err, post) => {
    if (err) {
      console.error('Error checking post:', err);
      return res.status(500).json({ error: "Database error bij het controleren van post" });
    }
    if (!post) {
      return res.status(404).json({ error: "Post niet gevonden" });
    }

    // Verwijder de like
    db.run("DELETE FROM likes WHERE post_id = ? AND user_id = ?", [postId, userId], function(err) {
      if (err) {
        console.error('Error removing like:', err);
        return res.status(500).json({ error: "Database error bij het verwijderen van like" });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: "Like niet gevonden" });
      }
      res.json({ message: "Like succesvol verwijderd" });
    });
  });
});

// Commentaar toevoegen
app.post("/api/posts/:postId/comments", (req, res) => {
  const { postId } = req.params;
  const { userId, content } = req.body;

  if (!userId || !content) {
    return res.status(400).json({ error: "Gebruiker ID en inhoud zijn verplicht" });
  }

  db.run(
    `INSERT INTO comments (user_id, post_id, content) VALUES (?, ?, ?)`,
    [userId, postId, content],
    function (err) {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Fout bij het plaatsen van de reactie" });
      }

      // Haal de nieuwe comment op met gebruikersinformatie
      db.get(
        `SELECT c.*, u.username 
         FROM comments c
         JOIN users u ON c.user_id = u.id
         WHERE c.id = ?`,
        [this.lastID],
        (err, comment) => {
          if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Fout bij het ophalen van de reactie" });
          }
          res.status(201).json(comment);
        }
      );
    }
  );
});

// Haal likes en comments op voor een post
app.get("/api/posts/:postId", (req, res) => {
  const { postId } = req.params;

  db.get(
    `SELECT p.*, u.username,
     (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
     (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
     FROM posts p
     JOIN users u ON p.user_id = u.id
     WHERE p.id = ?`,
    [postId],
    (err, post) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      if (!post) {
        return res.status(404).json({ error: "Post niet gevonden" });
      }

      // Haal comments op
      db.all(
        `SELECT c.*, u.username 
         FROM comments c
         JOIN users u ON c.user_id = u.id
         WHERE c.post_id = ?
         ORDER BY c.created_at DESC`,
        [postId],
        (err, comments) => {
          if (err) {
            return res.status(500).json({ error: "Database error" });
          }
          res.json({ ...post, comments });
        }
      );
    }
  );
});

// Haal profiel informatie op
app.get("/api/users/:userId", (req, res) => {
  const userId = req.params.userId;
  
  db.get(
    `SELECT u.*, 
     (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as post_count
     FROM users u WHERE u.id = ?`,
    [userId],
    (err, user) => {
      if (err) {
        console.error('Error fetching user:', err);
        return res.status(500).json({ error: "Database error bij het ophalen van gebruiker" });
      }
      if (!user) {
        return res.status(404).json({ error: "Gebruiker niet gevonden" });
      }
      res.json(user);
    }
  );
});

// Haal posts op van een specifieke gebruiker
app.get("/api/users/:userId/posts", (req, res) => {
  const { userId } = req.params;
  
  db.all(
    `SELECT p.*, u.username,
     (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
     (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
     (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ?) as is_liked
     FROM posts p
     LEFT JOIN users u ON p.user_id = u.id
     WHERE p.user_id = ?
     ORDER BY p.created_at DESC`,
    [req.query.userId || 0, userId],
    (err, posts) => {
      if (err) {
        console.error('Error fetching user posts:', err);
        return res.status(500).json({ error: "Database error bij het ophalen van gebruikersposts" });
      }

      // Haal comments op voor elke post
      const postsWithComments = posts.map(post => ({
        ...post,
        comments: []
      }));

      // Haal comments op voor elke post
      const postIds = posts.map(post => post.id);
      if (postIds.length > 0) {
        db.all(
          `SELECT c.*, u.username
           FROM comments c
           JOIN users u ON c.user_id = u.id
           WHERE c.post_id IN (${postIds.join(',')})
           ORDER BY c.created_at DESC
           LIMIT 3`,
          (err, comments) => {
            if (err) {
              console.error('Error fetching comments:', err);
              return res.status(500).json({ error: "Database error bij het ophalen van comments" });
            }

            // Voeg comments toe aan de juiste posts
            comments.forEach(comment => {
              const post = postsWithComments.find(p => p.id === comment.post_id);
              if (post) {
                post.comments.push(comment);
              }
            });

            res.json(postsWithComments);
          }
        );
      } else {
        res.json(postsWithComments);
      }
    }
  );
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
