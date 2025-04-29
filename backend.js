require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const app = express();
const bcrypt = require("bcryptjs");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");
const path = require("path");

app.use(express.json()); // Web server
app.use(cookieParser()); // Manejo de cookies
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

// Serve the HTML file for the root path
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "main.html"));
});

const db = mysql.createConnection({
  // Crear conexión con los parámetros del .env
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  connectTimeout: 10000,
});

const ALGORITHM = process.env.ALGORITHM;
const IV_LENGTH = 16;
const SALT = process.env.SECRET_KEY;

db.connect((err) => {
  // Conectar a la DB
  if (err) {
    console.error("DB connection error:", err);
    return;
  }
  console.log("Connected to MySQL");
});

app.get("/get-users", (_req, res) => {
  // Conseguir lista de usuarios
  db.query("CALL getUsers()", (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Error executing query" });
    }
    res.json(results);
  });
});

app.post("/register", async (req, res) => {
  try {
    const response = await fetch("http://127.0.0.1:8000/backend/register.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const data = await response.text();
    if (!response.ok) {
      return res.status(response.status).send(data); // Forward PHP's error status
    }
    res.send(data);
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).send("Server is unreachable");
    }
    return; // <== VERY IMPORTANT to stop execution
  }
});

const query = (sql, values) => {
  // Método para query SQL
  return new Promise((resolve, reject) => {
    db.query(sql, values, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

app.post("/login", async (req, res) => {
  try {
    const response = await fetch("http://127.0.0.1:8000/backend/login.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const data = await response.text();
    if (!response.ok) {
      return res.status(response.status).send(data); // Forward PHP's error status
    }
    res.send(data);
  } catch (err) {
    if (!res.headersSent) {

      res.status(500).send("Server is unreachable");
    }
    return; // <== VERY IMPORTANT to stop execution
  }
});

app.get("/accounts", (req, res) => {
  // Conseguir cuentas del usuario
  const username = req.query.username;

  if (!username) {
    return res.status(400).json({ error: "Username is required in cookies" });
  }

  db.query("CALL getUserAccounts(?)", [username], (err, results) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Database query failed", details: err.message });
    }

    if (Array.isArray(results)) {
      res.json(results);
    } else {
      res.status(404).json({ error: "No accounts found for this username" });
    }
  });
});

app.post("/add-account", async (req, res) => {
  // Añadir cuenta
  const {
    username,
    masterPassword,
    accountSite,
    accountUsername,
    accountPassword,
  } = req.body;

  try {
    const [rows] = await query("CALL getUserCredentials(?)", [username]);
    const userRows = rows[0];

    if (userRows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    if (!(await bcrypt.compare(masterPassword, userRows.password)))
      return res.status(400).json({ message: "Incorrect master password." });

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
    await query("CALL addAccount(?, ?, ?, ?)", [
      userId,
      accountSite,
      accountUsername,
      encryptedAccountPassword,
    ]);

    res.status(201).json({ message: "Account added successfully." });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

app.post("/editAccount", async (req, res) => {
  // Editar cuenta
  const {
    old_account_name,
    old_account_password,
    old_account_username,
    masterPassword,
    account_name,
    account_password,
    account_username,
    user_id,
  } = req.body;
  const results = await query("CALL getUserById(?)", [user_id]);
  const user = results[0][0];
  if (!(await bcrypt.compare(masterPassword, user.password)))
    return res.status(400).json({ message: "Incorrect master password." });

  const encryptedAccountPassword = encrypt(account_password, masterPassword);

  const [modifyResult] = await query("CALL editAccount(?, ?, ?, ?, ?, ?, ?)", [
    old_account_name,
    old_account_password,
    old_account_username,
    user_id,
    account_name,
    encryptedAccountPassword,
    account_username,
  ]);

  const modifiedRows = modifyResult[0]?.modified_rows;

  if (modifiedRows === 0) {
    return res.status(404).json({ message: "Account not found." });
  }

  return res.status(200).json({ message: "Account modified successfully." });
});

app.post("/deleteAccount", async (req, res) => {
  // Eliminar cuenta
  const {
    masterPassword,
    account_name,
    account_password,
    account_username,
    user_id,
  } = req.body;
  const results = await query("CALL getUserById(?)", [user_id]);
  const user = results[0][0];
  if (!(await bcrypt.compare(masterPassword, user.password)))
    return res.status(400).json({ message: "Incorrect master password." });
  const [deleteResult] = await query("CALL deleteAccount(?, ?, ?, ?)", [
    account_name,
    account_password,
    account_username,
    user_id,
  ]);

  const deletedRows = deleteResult[0]?.deleted_rows;

  if (deletedRows === 0) {
    return res
      .status(404)
      .json({ message: "Account not found or already deleted." });
  }

  return res.status(200).json({ message: "Account deleted successfully." });
});
app.post("/decrypt", async (req, res) => {
  // Desencriptar contraseña
  const { account_password, masterPassword } = req.body;

  try {
    const decrypted = decrypt(account_password, masterPassword);
    res.json({ decrypted });
  } catch (err) {
    return res.status(200).json({ message: "Incorrect master password." });
  }
});

app.post("/change-password", async (req, res) => {
  // Cambiar contraseña maestra
  const { username, currentMasterPassword, newMasterPassword } = req.body;

  try {
    const [rows] = await query("CALL getUserCredentials(?)", [username]); // Conseguir usuario
    const user = rows[0];

    if (!(await bcrypt.compare(currentMasterPassword, user.password))) {
      return res.status(400).json({ message: "Incorrect master password." });
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newMasterPassword, saltRounds); // Encriptar nueva contraseña

    const [userAccounts] = await query("CALL getUserAccounts(?)", [username]);

    for (const account of userAccounts) {
      const decryptedPassword = decrypt(
        account.account_password,
        currentMasterPassword
      ); // Reencriptar todas las contraseñas con la nueva contraseña maestra
      const reEncryptedPassword = encrypt(decryptedPassword, newMasterPassword);

      await query("CALL editAccount(?, ?, ?, ?, ?, ?, ?)", [
        account.account_name,
        account.account_password,
        account.account_username,
        user.user_id,
        account.account_name,
        reEncryptedPassword,
        account.account_username,
      ]);
    }
    await query("CALL changeUserPassword(?, ?)", [
      user.user_id,
      hashedPassword,
    ]); // Cambiar la contraseña maestra del usuario

    res.json({ message: "Password changed successfully." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

function getKeyFromPassword(password) {
  // Conseguir key para encripción
  return crypto.pbkdf2Sync(password, SALT, 100000, 32, "sha256");
}

function encrypt(text, masterPassword) {
  // Encriptar usando la contraseña maestra como key
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getKeyFromPassword(masterPassword);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

function decrypt(encrypted, masterPassword) {
  // Desencriptar usando la contraseña maestra como key
  const [ivHex, encryptedText] = encrypted.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const key = getKeyFromPassword(masterPassword);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

const PORT = process.env.PORT || 3000; // Puerto 3000 por defecto si no se define en el .env

app.listen(PORT, () => {
  // Iniciar servidor
  console.log(`Server running at http://${process.env.DB_HOST}:${PORT}`);
});
