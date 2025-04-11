function reloadPage() {
  const lightmode = document.getElementById("mode-select");
  let mode = lightmode.value == 1 ? "light" : "dark";
  const days = 7;
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = "expires=" + date.toUTCString();
  document.cookie = `theme=${mode}; ${expires}; path=/; samesite=Strict`;
  location.reload();
}
function getCookieObject() {
  return Object.fromEntries(
    document.cookie.split("; ").map((cookie) => cookie.split("="))
  );
}

function loadAccounts() {
  const username = document.cookie.replace(
    /(?:(?:^|.*;\s*)username\s*\=\s*([^;]*).*$)|^.*$/,
    "$1"
  );

  if (!username) {
    console.error("Username cookie is not set.");
    return;
  }
  fetch(
    `http://localhost:3000/accounts?username=${encodeURIComponent(username)}`,
    {
      method: "GET",
    }
  )
    .then((response) => response.json())
    .then((data) => {
      const accountsList = document.getElementById("accounts-list");

      if (Array.isArray(data)) {
        data.forEach((account) => {
          const listItem = document.createElement("li");
          listItem.textContent = `Site: ${account.account_name}, Username: ${account.account_username}`;

          const showPasswordButton = document.createElement("button");
          showPasswordButton.textContent = "Show Password";
          const cookies = getCookieObject();
          if (cookies.theme === "dark") showPasswordButton.classList.add("dark-mode");

          // Attach event listener to the button
          showPasswordButton.addEventListener("click", async () => {
            const masterPassword =
              document.getElementById("master-password").value;
            if (!masterPassword) {
              alert("Please enter your master password.");
              return;
            }

            let account_password = account.account_password;
            const decryptedPassword = await decrypt(
              account_password,
              masterPassword
            );
            showPasswordButton.style.display = "none";
            listItem.textContent = `Site: ${account.account_name}, Username: ${account.account_username}, password: ${decryptedPassword}`;
          });

          listItem.appendChild(showPasswordButton);
          accountsList.appendChild(listItem);
        });
      } else {
        console.error("Data is not an array:", data);
      }
    })
    .catch((error) => {
      console.error("Error fetching accounts:", error);
      alert("There was an error fetching the accounts.");
    });
}

async function decrypt(account_password, masterPassword) {
  const response = await fetch("http://localhost:3000/decrypt", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ account_password, masterPassword }),
  });

  const result = await response.json();
  return result.decrypted;
}

function loadCookies() {
  const cookies = getCookieObject();

  if (cookies.username)
    document.getElementById("welcome-text").innerHTML =
      "Welcome " + cookies.username;

  if (cookies.username) loadAccounts();
  else window.location.href = "./register.html";
}

function applyThemeFromCookie() {
  const cookies = getCookieObject();
  if (cookies.theme === "light") {
    document.body.classList.remove("dark-mode");
    document.getElementById("top-header").classList.remove("dark-mode");
    document.getElementById("addAccountButton").classList.remove("dark-mode");
    document.getElementById("user-button").classList.remove("dark-mode");
    document.querySelectorAll("button, select").forEach((element) => {
      element.classList.remove("dark-mode");
    });
    document.getElementById("mode-select").value = 1;
  } else if (cookies.theme === "dark") {
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

function flushCookies() {
  // Get all cookies
  let cookies = document.cookie.split(";");

  // Loop through all cookies and delete them
  cookies.forEach(function (cookie) {
    let cookieName = cookie.split("=")[0].trim();
    document.cookie =
      cookieName +
      "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/; samesite=Strict";
  });

  window.location.href = "main.html";
}

document
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
      alert("Please enter your master password.");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/add-account", {
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
      });

      // Log the response text for debugging purposes
      const responseText = await response.text();

      if (!response.ok) {
        // If response is not OK (status not 2xx)
        let errorData;
        try {
          errorData = JSON.parse(responseText); // Try parsing as JSON
        } catch (e) {
          errorData = { message: responseText }; // Fallback to text if it's not JSON
        }
        alert(errorData.message || "An error occurred"); // Show error message from server
      } else {
        let result;
        try {
          result = JSON.parse(responseText); // Try parsing as JSON
        } catch (e) {
          result = { message: responseText }; // Fallback to text if it's not JSON
        }
        alert(result.message); // Show success message or handle accordingly
      }
    } catch (err) {
      console.error("Error during register:", err);
      alert("An error occurred during register. Please try again later.");
    }
  });

// Run it as soon as possible
document.addEventListener("DOMContentLoaded", loadCookies);
applyThemeFromCookie();
