const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { authenticateToken } = require('./auth');

// Multer configuratie voor profielfoto upload
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

// Gebruikersprofiel ophalen
router.get("/:userId", authenticateToken, (req, res) => {
  const { userId } = req.params;

  db.get(
    `SELECT id, username, email, profile_picture, bio, created_at,
     (SELECT COUNT(*) FROM posts WHERE user_id = ?) as post_count,
     (SELECT COUNT(*) FROM follows WHERE follower_id = ?) as following_count,
     (SELECT COUNT(*) FROM follows WHERE following_id = ?) as followers_count
     FROM users WHERE id = ?`,
    [userId, userId, userId, userId],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: "Database error bij het ophalen van gebruikersprofiel" });
      }
      if (!user) {
        return res.status(404).json({ error: "Gebruiker niet gevonden" });
      }
      res.json(user);
    }
  );
});

// Posts van een gebruiker ophalen
router.get("/:userId/posts", authenticateToken, (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;

  db.all(
    `SELECT p.*, u.username,
     (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
     (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
     (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ?) as is_liked
     FROM posts p
     LEFT JOIN users u ON p.user_id = u.id
     WHERE p.user_id = ?
     ORDER BY p.created_at DESC`,
    [currentUserId, userId],
    (err, posts) => {
      if (err) {
        return res.status(500).json({ error: "Database error bij het ophalen van gebruikersposts" });
      }
      res.json(posts);
    }
  );
});

// Profiel bijwerken
router.put("/profile", authenticateToken, upload.single("profile_picture"), (req, res) => {
  const { bio } = req.body;
  const userId = req.user.id;
  const profile_picture = req.file ? `/uploads/${req.file.filename}` : undefined;

  const updates = [];
  const params = [];

  if (bio !== undefined) {
    updates.push("bio = ?");
    params.push(bio);
  }

  if (profile_picture) {
    updates.push("profile_picture = ?");
    params.push(profile_picture);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: "Geen updates opgegeven" });
  }

  params.push(userId);

  const sql = `
    UPDATE users 
    SET ${updates.join(", ")}
    WHERE id = ?
  `;

  db.run(sql, params, function (err) {
    if (err) {
      return res.status(500).json({ error: "Database error bij het bijwerken van profiel" });
    }
    res.json({ message: "Profiel succesvol bijgewerkt" });
  });
});

// Gebruiker volgen
router.post("/:userId/follow", authenticateToken, (req, res) => {
  const { userId } = req.params;
  const followerId = req.user.id;

  if (userId === followerId) {
    return res.status(400).json({ error: "Je kunt jezelf niet volgen" });
  }

  db.run(
    `INSERT INTO follows (follower_id, following_id) VALUES (?, ?)`,
    [followerId, userId],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: "Je volgt deze gebruiker al" });
        }
        return res.status(500).json({ error: "Database error bij het volgen van gebruiker" });
      }
      res.json({ message: "Gebruiker succesvol gevolgd" });
    }
  );
});

// Ontvolgen
router.delete("/:userId/follow", authenticateToken, (req, res) => {
  const { userId } = req.params;
  const followerId = req.user.id;

  db.run(
    `DELETE FROM follows WHERE follower_id = ? AND following_id = ?`,
    [followerId, userId],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Database error bij het ontvolgen van gebruiker" });
      }
      res.json({ message: "Gebruiker succesvol ontvolgd" });
    }
  );
});

module.exports = router; 