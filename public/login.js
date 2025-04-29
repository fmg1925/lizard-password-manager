function setInfoTextWithCooldown(text) {
  var infoText = document.getElementById("info");
  infoText.textContent = text;
  setTimeout(function () {
    infoText.textContent = "";
  }, 3000);
}

document.getElementById("loginForm").addEventListener("submit", async (e) => { // Formulario de inicio de sesión
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  if(password.length < 16) return setInfoTextWithCooldown("Passwords can't be less than 16 characters long");

  try {
    const response = await fetch(
      `${window.location.protocol}//${window.location.hostname}:3000/login`,
      {
        // Iniciar sesión
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
        credentials: "include",
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
      return setInfoTextWithCooldown("Incorrect username or password");
    } else {
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        result = { message: responseText };
      }
      setInfoTextWithCooldown(result.message);
      const days = 7;
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      const expires = "expires=" + date.toUTCString();
      document.cookie = `username=${username}; ${expires}; path=/; samesite=Strict`; // Asignar (o renovar) cookies
      window.location.href = "main.html"; // Redirigir a página principal
    }
  } catch (err) {
    console.error("Error during login:", err);
    return setInfoTextWithCooldown("Error encountered while logging in");
  }
});

//Funciones para mantener y elegir el tema(oscuro y claro)

function cargarTema() {
  const tema = localStorage.getItem("DarkMode");
  const selectdark = document.getElementById("mode-select");
  if (tema == "dark") {
    selectdark.value = 1;
  }
  reloadPage();
}

function reloadPage() {
  const darkMode = document.getElementById("mode-select").value;
  let darkModeItems = document.querySelectorAll("select, button, input, header, body");
  if (darkMode == 1) {
    localStorage.setItem("DarkMode", "light");
    darkModeItems.forEach((element) => {
      element.classList.remove("dark-mode");
    });
  } else {
    localStorage.setItem("DarkMode", "dark");
    darkModeItems.forEach((element) => {
      element.classList.add("dark-mode");
    });
  }
}

document.addEventListener("DOMContentLoaded", cargarTema);
