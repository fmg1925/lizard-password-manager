require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const app = express();
const bcrypt = require("bcryptjs");
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

app.use(express.json());
app.use(cors());
app.use(cookieParser());


// Set cookie
app.get('/set-cookie', (req, res) => {
  res.cookie('username', 'JohnDoe', { maxAge: 86400000, httpOnly: true });
  res.send('Cookie has been set');
});

// Get cookie
app.get('/get-cookie', (req, res) => {
  const username = req.cookies.username;
  res.send(`Hello ${username}`);
});

// Delete cookie
app.get('/delete-cookie', (req, res) => {
  res.clearCookie('username');
  res.send('Cookie has been deleted');
});

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: "main",
});

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;
const SALT = process.env.SECRET_KEY; // should be stored securely

db.connect((err) => {
  if (err) {
    console.error("DB connection error:", err);
    return;
  }
  console.log("Connected to MySQL");
});

app.get("/get-users", (req, res) => {
  const query = "SELECT * FROM users";

  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Error executing query" });
    }
    res.json(results);
  });
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  const query =
    "INSERT INTO users (username, password) VALUES (?, ?)";

  db.query(query, [username, hashedPassword], (err, results) => {
    if (err) {
      console.error("Error inserting user:", err);
      return res.status(500).json({ error: "Failed to insert user" });
    }

    console.log("User inserted successfully");
    res.status(200).json({ message: "User inserted successfully" });
  });
});

// Promisify the db query to make it async/await compatible (for mysql)
const query = (sql, values) => {
  return new Promise((resolve, reject) => {
    db.query(sql, values, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

// Async login route
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Query the database for the user
    const results = await query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);

    if (results.length > 0) {
      const user = results[0];

      // Check if the password matches
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) {
          console.error(err); // Log error
          return res.status(500).json({ message: "Error checking password" });
        }

        if (isMatch) {
          return res.status(200).json({ message: "Login successful" });
        } else {
          return res.status(401).json({ message: "Incorrect password" });
        }
      });
    } else {
      return res.status(404).json({ message: "User not found" });
    }

  } catch (err) {
    console.error("Database error:", err);
    return res.status(500).json({ message: "Database error" });
  }
});

app.get('/accounts', (req, res) => {
  const username = req.query.username;

  if (!username) {
    return res.status(400).json({ error: 'Username is required in cookies' });
  }

  // SQL query to get accounts based on the username
  const sql = `
    SELECT a.user_id, a.account_name, a.account_username, a.account_password, u.username
    FROM accounts a
    JOIN users u ON a.user_id = u.user_id
    WHERE u.username = ?`; // Filter by username
  
  db.query(sql, [username], (err, results) => {
    if (err) {
      console.error('Database query failed:', err);  // Log the detailed error
      return res.status(500).json({ error: 'Database query failed', details: err.message });
    }

    // Ensure results are returned as an array
    if (Array.isArray(results)) {
      res.json(results);
    } else {
      res.status(404).json({ error: 'No accounts found for this username' });
    }
  });
});

app.post("/add-account", async (req, res) => {
  const { username, masterPassword, accountSite, accountUsername, accountPassword } = req.body;

  // Query to get the user's hashed password
  const query = "SELECT * FROM users WHERE username = ?";
  db.query(query, [username], async (err, results) => {
    if (err) {
      console.error("Error querying user:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = results[0];
    const isPasswordCorrect = await bcrypt.compare(masterPassword, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const encryptedAccountPassword = encrypt(accountPassword, masterPassword);

    // Store the encrypted account password in the database
    const insertAccountQuery = "INSERT INTO accounts (user_id, account_name, account_username, account_password) VALUES (?, ?, ?, ?)";
    db.query(insertAccountQuery, [user.user_id, accountSite, accountUsername, encryptedAccountPassword], (err, result) => {
      if (err) {
        console.error("Error inserting account:", err);
        return res.status(500).json({ error: "Failed to insert account" });
      }

      res.status(200).json({ message: "Account password encrypted and stored successfully" });
    });
  });
});

app.post("/decrypt", async (req, res) => {
  const { account_password, masterPassword } = req.body;

  if (!account_password || !masterPassword) {
    return res.status(400).json({ error: "Missing encryptedData or masterPassword" });
  }

  try {
    const decrypted = decrypt(account_password, masterPassword);
    res.json({ decrypted });
  } catch (err) {
    console.error("Decryption error:", err);
    res.status(500).json({ error: "Decryption failed. Possibly wrong master password or invalid data." });
  }
});

// Derive a key from master password
function getKeyFromPassword(password) {
  return crypto.pbkdf2Sync(password, SALT, 100000, 32, 'sha256');
}

function encrypt(text, masterPassword) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getKeyFromPassword(masterPassword);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(encrypted, masterPassword) {
  const [ivHex, encryptedText] = encrypted.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const key = getKeyFromPassword(masterPassword);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
