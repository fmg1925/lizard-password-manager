let cooldownTimeoutId = null;

function setInfoTextWithCooldown(text) {
  var infoText = document.getElementById("info");
  infoText.textContent = text;
  if (cooldownTimeoutId !== null) {
    clearTimeout(cooldownTimeoutId);
  }
  cooldownTimeoutId = setTimeout(() => {
    infoText.textContent = "";
    cooldownTimeoutId = null; // Reset the timeout ID
  }, 3000);
}

function reloadPage() {
  // Al cambiar el tema, recargar la página y cambiar el tema en las cookies
  const lightmode = document.getElementById("mode-select");
  let mode = lightmode.value == 0 ? "light" : "dark";
  const days = 7;
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = "expires=" + date.toUTCString();
  document.cookie = `theme=${mode}; ${expires}; path=/; samesite=Strict`;
  localStorage.setItem("DarkMode", mode)
  location.reload();
}

function changeValue(amount) {
  const input = document.getElementById('password-length-textbox');
  let value = parseInt(input.value) || 16;
  value += amount;
  if (value < 12) value = 12;
  if (value > 32) value = 32;
  input.value = value;
  generatePassword(); // if you still want to use your function
}

function getCookieObject() {
  // Conseguir cookies
  return Object.fromEntries(
    document.cookie.split("; ").map((cookie) => cookie.split("="))
  );
}

async function loadAccounts() {
  // Cargar cuentas
  const cookies = getCookieObject();

  if (!cookies.username) {
    return;
  }
  fetch(
    `${window.location.protocol}//${
      window.location.hostname
    }/accounts?username=${encodeURIComponent(cookies.username)}`,
    {
      method: "GET",
    }
  )
    .then((response) => response.json())
    .then((data) => {
      if (data.length === 0)
        return setInfoTextWithCooldown("You have no accounts registered");
      const accountsList = document.getElementById("accounts-list");
      accountsList.innerHTML = ""; // Vaciar lista (en caso de recargar)

      if (Array.isArray(data) && Array.isArray(data[0])) {
        data[0].forEach((account) => {
          const listItem = document.createElement("li"); // Añadir cuentas a la lista
          listItem.textContent = `Site: ${account.account_name}, Username: ${account.account_username}`;

          const showPasswordButton = document.createElement("button");
          showPasswordButton.textContent = "Show Password";

          const editAccountButton = document.createElement("button");
          editAccountButton.textContent = "Edit Account";
          
          const deleteAccountButton = document.createElement("button");
          deleteAccountButton.textContent = "Delete Account";
          
          const cookies = getCookieObject(); // Aplicar tema oscuro a los nuevos botones
          
          if (cookies.theme === "dark" || localStorage.getItem("DarkMode") == 'dark') {
            showPasswordButton.classList.add("dark-mode");
            editAccountButton.classList.add("dark-mode");
            deleteAccountButton.classList.add("dark-mode");
          }

          // Attach event listener to the button
          showPasswordButton.addEventListener("click", async () => {
            // Mostrar contraseña
            const masterPassword =
              document.getElementById("master-password").value;
            if (!masterPassword) {
              return setInfoTextWithCooldown("Please enter your master password");
            }

            let account_password = account.account_password;
            const decryptedPassword = await decrypt(
              account_password,
              masterPassword
            );
            if (decryptedPassword === "") {
              return setInfoTextWithCooldown("Incorrect master password");
            }
            showPasswordButton.style.display = "none";
            listItem.textContent = `Site: ${account.account_name}, Username: ${account.account_username}, Password: ${decryptedPassword}`;
          });

          editAccountButton.addEventListener("click", async () => {
            // Editar cuenta
            const masterPassword =
              document.getElementById("master-password").value;
            if (!masterPassword) {
              return setInfoTextWithCooldown("Please enter your master password");
            }

            newAccountName = document.getElementById("site").value;
            if (!newAccountName) {
              return setInfoTextWithCooldown("Please enter the site name.");
          }
            newAccountUsername = document.getElementById("username").value;
            if (!newAccountUsername) {
              return setInfoTextWithCooldown("Please enter the account username.");
          }
            newAccountPassword = document.getElementById("password").value;
            if (!newAccountPassword) {
              return setInfoTextWithCooldown("Please enter the account password.");
          }
            const response = await fetch(
              `${window.location.protocol}//${window.location.hostname}/editAccount`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  old_account_name: account.account_name,
                  old_account_password: account.account_password,
                  old_account_username: account.account_username,
                  masterPassword: masterPassword,
                  account_name: newAccountName,
                  account_password: newAccountPassword,
                  account_username: newAccountUsername,
                  user_id: account.user_id,
                }),
              }
            );
            if (response.ok) {
              infoText =
                "Account modified succesfully";
              return window.reloadPage();
            } else {
              setInfoTextWithCooldown("Incorrect master password");
            }
          });

          deleteAccountButton.addEventListener("click", async () => {
            // Eliminar cuenta
            const masterPassword =
              document.getElementById("master-password").value;
            if (!masterPassword) {
              setInfoTextWithCooldown("Please enter your master password");
            }
            const response = await fetch(
              `${window.location.protocol}//${window.location.hostname}/deleteAccount`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  masterPassword: masterPassword,
                  account_name: account.account_name,
                  account_password: account.account_password,
                  account_username: account.account_username,
                  user_id: account.user_id,
                }),
              }
            );
            if (response.ok) {
              setInfoTextWithCooldown("Account deleted succesfully");
              return window.reloadPage();
            } else {
              return setInfoTextWithCooldown("Incorrect master password");
            }
          });

          listItem.appendChild(showPasswordButton);
          listItem.appendChild(editAccountButton);
          listItem.appendChild(deleteAccountButton);
          accountsList.appendChild(listItem);
        });
      } else {
        console.error("Data is not an array:", data);
      }
    })
    .catch((error) => {
      console.error("Error fetching accounts:", error);
      infoText = "Error loading accounts";
    });
}

async function decrypt(account_password, masterPassword) {
  // Desencriptar contraseña
  try {
    const response = await fetch(
      `${window.location.protocol}//${window.location.hostname}/decrypt`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ account_password, masterPassword }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return "";
    }

    return result.decrypted || "";
  } catch (error) {
    console.error("Failed to send request:", error);
    return "";
  }
}

function loadCookies() {
  // Cargar cookies
  const cookies = getCookieObject();

  if (cookies.username) {
    document.getElementById("welcome-text").textContent =
      "Welcome " + cookies.username; // Mostrar nombre de usuario en la bienvenida
    loadAccounts(); // Cargar cuentas
  } else window.location.href = "./register.html"; // Si no hay usuario, redirigir al registro
}

function applyThemeFromCookie() {
  // Aplicar tema
  const cookies = getCookieObject(); // Get cookies
  const tema = localStorage.getItem("DarkMode"); // LocalStorage
  let theme = false; // Default value

 if (tema !== null) {
   theme = tema === "light" ? false : true; // Convierte string a boolean
 }
 else if (cookies.theme !== undefined) {
   cookies.theme == "light" ? (theme = false) : (theme = true);
   localStorage.setItem("DarkMode", cookies.theme);
 }
  if(theme) {
    // Modo oscuro
    document.getElementById('user-button').classList.add('dark-mode');
    document.querySelectorAll("button, select, header, body").forEach((element) => {
      element.classList.add("dark-mode");
    });
    document.getElementById("mode-select").value = 1;
  }
}

function flushCookies() {
  // Eliminar cookies
  let cookies = document.cookie.split(";");

  cookies.forEach(function (cookie) {
    let cookieName = cookie.split("=")[0].trim();
    document.cookie =
      cookieName +
      "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/; samesite=Strict";
  });
  localStorage.clear();

  window.location.href = "main.html";
}

document // Añadir cuenta
  .getElementById("addAccountForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const cookies = getCookieObject();
    const username = cookies.username;
    const accountSite = document.getElementById("site").value;
    const accountUsername = document.getElementById("username").value;
    const accountPassword = document.getElementById("password").value;

    const masterPassword = document.getElementById("master-password").value;
    if (!masterPassword) {
      setInfoTextWithCooldown("Please enter your master password");
    }

    try {
      const response = await fetch(
        `${window.location.protocol}//${window.location.hostname}/add-account`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            masterPassword,
            accountSite,
            accountUsername,
            accountPassword,
          }),
        }
      );

      const responseText = await response.text();
      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
          return setInfoTextWithCooldown(errorData.message);
        } catch (e) {
          errorData = { message: responseText };
          return setInfoTextWithCooldown(errorData.message);
        }
      } else {
        let result;
        try {
          result = JSON.parse(responseText);
          setInfoTextWithCooldown(result.message);
        } catch (e) {
          return setInfoTextWithCooldown(responseText);
        }
      }
    } catch (err) {
      return setInfoTextWithCooldown("Error adding account");
    }
    loadAccounts(); // Recargar cuentas
  });

function generatePassword() { // Generar contraseña
  const length = parseInt(document.getElementById("password-length-textbox").value);
  const includeLetters = document.getElementById("password-letters").checked;
  const includeNumbers = document.getElementById("password-numbers").checked;
  const includeSymbols = document.getElementById("password-symbols").checked;

  const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";

  let charset = "";
  if (includeLetters) charset += letters;
  if (includeNumbers) charset += numbers;
  if (includeSymbols) charset += symbols;

  if (charset === "") {
    document.getElementById("generated-password").value =
      "Please select at least one character type.";
    return;
  }

  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }

  document.getElementById(
    "generated-password"
  ).value = password;
}

function copyPassword() // Copiar contraseña al portapapeles
{
  var copyText = document.getElementById("generated-password");

  copyText.select();
  copyText.setSelectionRange(0, 99999);

  navigator.clipboard.writeText(copyText.value);
}

document.getElementById("change-password-form") // Cambio de contraseña maestra
  .addEventListener('submit', async function(e)
{
  e.preventDefault();
    const cookies = getCookieObject();
    const username = cookies.username;
    const currentMasterPassword = document.getElementById("current-master-password-textbox").value;
    const newMasterPassword = document.getElementById("new-master-password-textbox").value;

    try {
    const response = await fetch(`${window.location.protocol}//${window.location.hostname}/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, currentMasterPassword, newMasterPassword }),
    });

    if (!response.ok) {
      const err = await response.json();
      return setInfoTextWithCooldown(err.message);
    } else {
      setInfoTextWithCooldown("Password changed successfully");
      return location.reload();
    }
  } catch(err) {
      return setInfoTextWithCooldown(err.message);
  }
});

document.addEventListener("DOMContentLoaded", loadCookies); // Cargar cookies al cargar el DOM
applyThemeFromCookie(); // Aplicar tema
generatePassword(); // Generar contraseña
