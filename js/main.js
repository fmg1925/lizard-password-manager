const PORT = 3000; // Puerto Node

function reloadPage() { // Al cambiar el tema, recargar la página y cambiar el tema en las cookies
  const lightmode = document.getElementById("mode-select");
  let mode = lightmode.value == 1 ? "light" : "dark";
  const days = 7;
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = "expires=" + date.toUTCString();
  document.cookie = `theme=${mode}; ${expires}; path=/; samesite=Strict`;
  location.reload();
}

function getCookieObject() { // Conseguir cookies
  return Object.fromEntries(
    document.cookie.split("; ").map((cookie) => cookie.split("="))
  );
}

async function loadAccounts() { // Cargar cuentas
  const cookies = getCookieObject();

  if (!cookies.username) {
    console.error("Username cookie is not set.");
    return;
  }
  fetch(
    `${window.location.protocol}//${
      window.location.hostname
    }:${PORT}/accounts?username=${encodeURIComponent(cookies.username)}`,
    {
      method: "GET",
    }
  )
    .then((response) => response.json())
    .then((data) => {
      if (data.length === 0)
        return (document.getElementById("info").innerHTML =
          "You have no accounts registered");
      const accountsList = document.getElementById("accounts-list");
      accountsList.innerHTML = ""; // Vaciar lista (en caso de recargar)

      if (Array.isArray(data) && Array.isArray(data[0])) {
        data[0].forEach((account) => {
          const listItem = document.createElement("li"); // Añadir cuentas a la lista
          listItem.textContent = `Site: ${account.account_name}, Username: ${account.account_username}`;

          const showPasswordButton = document.createElement("button");
          showPasswordButton.textContent = "Show Password";
          const cookies = getCookieObject(); // Aplicar tema oscuro a los nuevos botones
          if (cookies.theme === "dark")
            showPasswordButton.classList.add("dark-mode");

          const editAccountButton = document.createElement("button");
          editAccountButton.textContent = "Edit Account";
          if (cookies.theme === "dark")
            editAccountButton.classList.add("dark-mode");

          const deleteAccountButton = document.createElement("button");
          deleteAccountButton.textContent = "Delete Account";
          if (cookies.theme === "dark")
            deleteAccountButton.classList.add("dark-mode");

          // Attach event listener to the button
          showPasswordButton.addEventListener("click", async () => { // Mostrar contraseña
            const masterPassword =
              document.getElementById("master-password").value;
            if (!masterPassword) {
              return document.getElementById("info").innerHTML =
                "Please enter your master password";
            }

            let account_password = account.account_password;
            const decryptedPassword = await decrypt(
              account_password,
              masterPassword
            );
            if (decryptedPassword === "") {
              return (document.getElementById("info").innerHTML =
                "Incorrect master password");
            }
            showPasswordButton.style.display = "none";
            listItem.textContent = `Site: ${account.account_name}, Username: ${account.account_username}, password: ${decryptedPassword}`;
          });

          editAccountButton.addEventListener("click", async () => { // Editar cuenta
            const masterPassword =
              document.getElementById("master-password").value;
            if (!masterPassword) {
              document.getElementById("info").innerHTML =
                "Please enter your master password";
              return;
            }

            newAccountName = document.getElementById('site').value;
            if(!newAccountName) return document.getElementById("info").innerHTML = "Please enter the site name.";
            newAccountUsername = document.getElementById('username').value;
            if(!newAccountUsername) return document.getElementById("info").innerHTML = "Please enter the account username.";
            newAccountPassword = document.getElementById('password').value;
            if(!newAccountPassword) return document.getElementById("info").innerHTML = "Please enter the account password.";
            const response = await fetch(
              `${window.location.protocol}//${window.location.hostname}:${PORT}/editAccount`,
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
                  account_name : newAccountName,
                  account_password: newAccountPassword,
                  account_username: newAccountUsername,
                  user_id: account.user_id,
                }), 
              }
            );
            if(response.ok) { document.getElementById("info").innerHTML = "Account modified succesfully"; return window.reloadPage(); }
            else {return document.getElementById("info").innerHTML = "Incorrect master password";}
          });

          deleteAccountButton.addEventListener("click", async () => { // Eliminar cuenta
            const masterPassword =
              document.getElementById("master-password").value;
            if (!masterPassword) {
              document.getElementById("info").innerHTML =
                "Please enter your master password";
              return;
            }
            const response = await fetch(
              `${window.location.protocol}//${window.location.hostname}:${PORT}/deleteAccount`,
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
            if(response.ok) { document.getElementById("info").innerHTML = "Account deleted succesfully"; return window.reloadPage(); }
            else {return document.getElementById("info").innerHTML = "Incorrect master password";}
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
      document.getElementById("info").innerHTML = "Error loading accounts";
    });
}

async function decrypt(account_password, masterPassword) { // Desencriptar contraseña
  try {
    const response = await fetch(
      `${window.location.protocol}//${window.location.hostname}:${PORT}/decrypt`,
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

function loadCookies() { // Cargar cookies
  const cookies = getCookieObject();

  if (cookies.username) { 
    document.getElementById("welcome-text").innerHTML =
      "Welcome " + cookies.username; // Mostrar nombre de usuario en la bienvenida
    loadAccounts(); // Cargar cuentas
  } else window.location.href = "./register.html"; // Si no hay usuario, redirigir al registro
}

function applyThemeFromCookie() { // Aplicar tema
  const cookies = getCookieObject(); // Conseguir modo desde las cookies
  if (cookies.theme === "light") { // Modo claro
    document.body.classList.remove("dark-mode");
    document.getElementById("top-header").classList.remove("dark-mode");
    document.getElementById("addAccountButton").classList.remove("dark-mode");
    document.getElementById("user-button").classList.remove("dark-mode");
    document.querySelectorAll("button, select").forEach((element) => {
      element.classList.remove("dark-mode");
    });
    document.getElementById("mode-select").value = 1;
  } else if (cookies.theme === "dark") { // Modo oscuro
    document.body.classList.add("dark-mode");
    document.getElementById("top-header").classList.add("dark-mode");
    document.getElementById("addAccountButton").classList.add("dark-mode");
    document.getElementById("user-button").classList.add("dark-mode");
    document.querySelectorAll("button, select").forEach((element) => {
      element.classList.add("dark-mode");
    });
    document.getElementById("mode-select").value = 2;
  }
}

function flushCookies() { // Eliminar cookies
  let cookies = document.cookie.split(";");

  cookies.forEach(function (cookie) {
    let cookieName = cookie.split("=")[0].trim();
    document.cookie =
      cookieName +
      "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/; samesite=Strict";
  });

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
      document.getElementById("info").innerHTML =
        "Please enter your master password";
      return;
    }

    try {
      const response = await fetch(
        `${window.location.protocol}//${window.location.hostname}:${PORT}/add-account`,
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
        } catch (e) {
          errorData = { message: responseText };
        }
        document.getElementById("info").innerHTML = errorData.message;
      } else {
        let result;
        try {
          result = JSON.parse(responseText);
        } catch (e) {
          result = { message: responseText };
        }
        document.getElementById("info").innerHTML = result.message;
      }
    } catch (err) {
      document.getElementById("info").innerHTML = "Error adding account";
    }
    loadAccounts(); // Recargar cuentas
  });

document.addEventListener("DOMContentLoaded", loadCookies); // Cargar cookies al cargar el DOM
applyThemeFromCookie(); // Aplicar tema
