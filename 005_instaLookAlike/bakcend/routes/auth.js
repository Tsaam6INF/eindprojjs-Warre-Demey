const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

// Middleware voor JWT verificatie
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

// Registratie route
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  // Validatie van verplichte velden
  if (!username || !email || !password) {
    return res.status(400).json({ error: "Gebruikersnaam, email en wachtwoord zijn verplicht!" });
  }

  // Validatie van wachtwoord lengte
  if (password.length < 6) {
    return res.status(400).json({ error: "Wachtwoord moet minimaal 6 karakters lang zijn" });
  }

  // Validatie van email formaat
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Ongeldig email formaat" });
  }

  try {
    db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, email], async (err, row) => {
      if (err) {
        return res.status(500).json({ error: "Database error bij het controleren van gebruikersnaam of email" });
      }

      if (row) {
        return res.status(400).json({ error: "Deze gebruikersnaam of email bestaat al" });
      }

      try {
        const hashedPassword = await bcrypt.hash(password, 10);

        db.run(
          `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`,
          [username, email, hashedPassword],
          function (err) {
            if (err) {
              return res.status(500).json({ error: "Fout bij registratie", details: err.message });
            }
            const token = jwt.sign({ id: this.lastID, username }, 'your_jwt_secret');
            res.status(201).json({
              token,
              id: this.lastID,
              username: username
            });
          }
        );
      } catch (error) {
        res.status(500).json({ error: "Fout bij het versleutelen van het wachtwoord" });
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Fout bij registratie", details: error.message });
  }
});

// Login route
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.get(
    `SELECT * FROM users WHERE email = ?`,
    [email],
    async (err, user) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      try {
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
          return res.status(401).json({ error: "Invalid email or password" });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, 'your_jwt_secret');
        res.json({
          token,
          id: user.id,
          username: user.username
        });
      } catch (error) {
        res.status(500).json({ error: "Error validating password" });
      }
    }
  );
});

module.exports = { router, authenticateToken };
