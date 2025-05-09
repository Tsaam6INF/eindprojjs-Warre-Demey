const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());

// Multer configuratie voor bestand-upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Bestanden worden opgeslagen in de "uploads" map
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Zorgt ervoor dat het bestand een unieke naam krijgt
  }
});

const upload = multer({ storage: storage });

// Zorg ervoor dat de "uploads" map bestaat
const fs = require('fs');
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Statische bestanden serveren vanuit de 'uploads' map
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database
const db = new sqlite3.Database("db.sqlite3");

// Init tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    image_url TEXT,
    caption TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// Nieuwe post (met bestand-upload)
app.post("/api/posts", upload.single("image"), (req, res) => {
  const { user_id, caption } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  // Controleer of alle vereiste velden aanwezig zijn
  if (!user_id || !caption || !imageUrl) {
    return res.status(400).json({ error: "Je hebt een afbeelding en een bijschrift nodig!" });
  }

  db.run(
    `INSERT INTO posts (user_id, image_url, caption) VALUES (?, ?, ?)`,
    [user_id, imageUrl, caption],
    function (err) {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Fout bij het maken van de post" });
      }
      res.status(201).json({
        id: this.lastID,
        user_id,
        image_url: imageUrl,
        caption,
        created_at: new Date()
      });
    }
  );
});

app.get("/api/posts", (req, res) => {
  db.all("SELECT * FROM posts", (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    res.json(rows);
  });
});
app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
  
    db.get(
      `SELECT * FROM users WHERE username = ?`,
      [username],
      (err, row) => {
        if (err) {
          return res.status(500).json({ error: "Database error" });
        }
        if (row && bcrypt.compareSync(password, row.password)) {
          res.json({
            id: row.id,
            username: row.username
          });
        } else {
          res.status(401).json({ error: "Invalid username or password" });
        }
      }
    );
  });
  // Register route
app.post("/api/register", async (req, res) => {
    const { username, password } = req.body;
  
    if (!username || !password) {
      return res.status(400).json({ error: "Username en wachtwoord zijn verplicht!" });
    }
  
    // Versleutelen van het wachtwoord met bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);
  
    db.run(
      `INSERT INTO users (username, password) VALUES (?, ?)`,
      [username, hashedPassword],
      function (err) {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ error: "Fout bij registratie" });
        }
        res.status(201).json({
          id: this.lastID,
          username: username
        });
      }
    );
  });
  
  // Start de server
app.listen(3001, () => console.log("Backend running on http://localhost:3001"));
