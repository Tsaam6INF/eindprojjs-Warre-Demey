const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { authenticateToken } = require('./auth');

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

// Nieuwe post maken
router.post("/", authenticateToken, upload.single("image"), (req, res) => {
  const { caption } = req.body;
  const user_id = req.user.id;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;

  if (!image_url) {
    return res.status(400).json({ error: "Afbeelding is verplicht" });
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

// Alle posts ophalen
router.get("/", authenticateToken, (req, res) => {
  db.all(
    `SELECT p.*, u.username,
     (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
     (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
     (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ?) as is_liked
     FROM posts p
     LEFT JOIN users u ON p.user_id = u.id
     ORDER BY p.id DESC`,
    [req.user.id],
    (err, posts) => {
      if (err) {
        return res.status(500).json({ error: "Database error bij het ophalen van posts" });
      }
      res.json(posts);
    }
  );
});

// Post liken/unliken
router.post("/:postId/like", authenticateToken, (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;

  // Eerst controleren of de post al geliked is
  db.get(
    `SELECT * FROM likes WHERE user_id = ? AND post_id = ?`,
    [userId, postId],
    (err, like) => {
      if (err) {
        return res.status(500).json({ error: "Database error bij het controleren van like status" });
      }

      if (like) {
        // Als de post al geliked is, verwijder de like
        db.run(
          `DELETE FROM likes WHERE user_id = ? AND post_id = ?`,
          [userId, postId],
          function (err) {
            if (err) {
              return res.status(500).json({ error: "Database error bij het verwijderen van de like" });
            }
            res.json({ action: 'unliked', message: "Like succesvol verwijderd" });
          }
        );
      } else {
        // Als de post nog niet geliked is, voeg een like toe
        db.run(
          `INSERT INTO likes (user_id, post_id) VALUES (?, ?)`,
          [userId, postId],
          function (err) {
            if (err) {
              return res.status(500).json({ error: "Database error bij het liken van de post" });
            }
            res.json({ action: 'liked', message: "Post succesvol geliked" });
          }
        );
      }
    }
  );
});

// Commentaar toevoegen
router.post("/:postId/comments", authenticateToken, (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;
  const { content } = req.body;

  if (!content || content.trim() === '') {
    return res.status(400).json({ error: "Commentaar mag niet leeg zijn" });
  }

  // Eerst controleren of de post bestaat
  db.get('SELECT id FROM posts WHERE id = ?', [postId], (err, post) => {
    if (err) {
      return res.status(500).json({ error: "Database error bij het controleren van post" });
    }
    if (!post) {
      return res.status(404).json({ error: "Post niet gevonden" });
    }

    // Commentaar toevoegen
    db.run(
      `INSERT INTO comments (user_id, post_id, content) VALUES (?, ?, ?)`,
      [userId, postId, content.trim()],
      function (err) {
        if (err) {
          return res.status(500).json({ error: "Database error bij het plaatsen van commentaar" });
        }

        // Haal de gebruikersnaam op voor de response
        db.get(
          `SELECT username FROM users WHERE id = ?`,
          [userId],
          (err, user) => {
            if (err) {
              return res.status(500).json({ error: "Database error bij het ophalen van gebruikersnaam" });
            }

            res.status(201).json({
              id: this.lastID,
              user_id: userId,
              post_id: postId,
              content: content.trim(),
              username: user.username,
              created_at: new Date().toISOString()
            });
          }
        );
      }
    );
  });
});

// Commentaren ophalen voor een post
router.get("/:postId/comments", authenticateToken, (req, res) => {
  const { postId } = req.params;

  db.all(
    `SELECT c.*, u.username 
     FROM comments c
     LEFT JOIN users u ON c.user_id = u.id
     WHERE c.post_id = ?
     ORDER BY c.created_at DESC`,
    [postId],
    (err, comments) => {
      if (err) {
        return res.status(500).json({ error: "Database error bij het ophalen van commentaren" });
      }
      res.json(comments);
    }
  );
});

// Like verwijderen
router.delete("/:postId/like", authenticateToken, (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;

  db.run(
    `DELETE FROM likes WHERE user_id = ? AND post_id = ?`,
    [userId, postId],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Database error bij het verwijderen van de like" });
      }
      res.json({ message: "Like succesvol verwijderd" });
    }
  );
});

module.exports = router; 