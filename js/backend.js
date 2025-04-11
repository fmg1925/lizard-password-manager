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

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

const ALGORITHM = process.env.ALGORITHM;
const IV_LENGTH = 16;
const SALT = process.env.SECRET_KEY; // should be stored securely

db.connect((err) => {
  if (err) {
    console.error("DB connection error:", err);
    return;
  }
  console.log("Connected to MySQL");
});

app.get("/get-users", (_req, res) => {
  db.query('CALL getUsers()', (err, results) => {
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

  db.query('CALL register(?, ?)', [username, hashedPassword], (err, _results) => {
    if (err) {
      return res.status(409).json({ message: "Username already exists" });
    }

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
    const results = await query("CALL checkExistingUsername(?)", [
      username,
    ]);

    if (results.length > 0) {
      const user = results[0][0];

      // Check if the password matches
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) {
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
    return res.status(500).json({ message: "Database error" });
  }
});

app.get('/accounts', (req, res) => {
  const username = req.query.username;

  if (!username) {
    return res.status(400).json({ error: 'Username is required in cookies' });
  }

  db.query('CALL getUserAccounts(?)', [username], (err, results) => {
    if (err) {
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

  try {

    // 1. Get the user_id from the 'users' table
    const [rows] = await query("CALL getUserCredentials(?)", [username]);
    const userRows = rows[0]; // Because CALL returns a nested array
  
    if (userRows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }
  
    if(!await bcrypt.compare(masterPassword, userRows.password)) return res.status(400).json({ message: "Incorrect master password." });

    const userId = userRows.user_id;
  
    const [resultSets] = await query(
      "CALL checkExistingAccountNames(?, ?, ?)",
      [userId, accountSite, accountUsername]
    );
  
    let nameTaken = false;
    let usernameTaken = false;
  
    for (const row of resultSets) {
      if (row.account_name === accountSite) nameTaken = true;
      if (row.account_username === accountUsername) usernameTaken = true;
    }
  
    if (nameTaken && usernameTaken) {
      return res.status(400).json({
        message: "Duplicate account details.",
      });
    }
  
    const encryptedAccountPassword = encrypt(accountPassword, masterPassword);
    // 3. If all good, insert the account
    await query(
      "CALL addAccount(?, ?, ?, ?)",
      [userId, accountSite, accountUsername, encryptedAccountPassword]
    );
  
    res.status(201).json({ message: "Account added successfully." });
  
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

app.post("/editAccount", async (req, res) => {
  const {old_account_name, old_account_password, old_account_username, masterPassword, account_name, account_password, account_username, user_id} = req.body;
  const results = await query("CALL getUserById(?)", [
    user_id]);
    const user = results[0][0];
  if(!await bcrypt.compare(masterPassword, user.password)) return res.status(400).json({ message: "Incorrect master password." });

  const encryptedAccountPassword = encrypt(account_password, masterPassword);

  const [modifyResult] = await query(
    "CALL editAccount(?, ?, ?, ?, ?, ?, ?)",
    [old_account_name, old_account_password, old_account_username, user_id, account_name, encryptedAccountPassword, account_username]
  );

  // Print result
console.log("Procedure result:", modifyResult);
  
  const modifiedRows = modifyResult[0]?.modified_rows;
  
  if (modifiedRows === 0) {
    return res.status(404).json({ message: "Account not found." });
  }
  
  return res.status(200).json({ message: "Account modified successfully." });
});

app.post("/deleteAccount", async (req, res) => {
  const {masterPassword, account_name, account_password, account_username, user_id} = req.body;
  const results = await query("CALL getUserById(?)", [
    user_id]);
    const user = results[0][0];
  if(!await bcrypt.compare(masterPassword, user.password)) return res.status(400).json({ message: "Incorrect master password." });
  const [deleteResult] = await query(
    "CALL deleteAccount(?, ?, ?, ?)",
    [account_name, account_password, account_username, user_id]
  );
  
  const deletedRows = deleteResult[0]?.deleted_rows;
  
  if (deletedRows === 0) {
    return res.status(404).json({ message: "Account not found or already deleted." });
  }
  
  return res.status(200).json({ message: "Account deleted successfully." });
});
app.post("/decrypt", async (req, res) => {
  const { account_password, masterPassword } = req.body;

  try {
    const decrypted = decrypt(account_password, masterPassword);
    res.json({ decrypted });
  } catch (err) {
    return res.status(200).json({ message: "Incorrect master password." });
  }
});

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
    const [ivHex, encryptedText] = encrypted.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const key = getKeyFromPassword(masterPassword);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
}

const PORT = process.env.PORT || 3000;

app.get('/config', (_req, res) => {
  res.json({ port: PORT });
});

app.listen(PORT, () => {
  console.log(`Server running at http://${process.env.DB_HOST}:${PORT}`);
});
