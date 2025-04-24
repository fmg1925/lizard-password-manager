function setInfoTextWithCooldown(text) {
  var infoText = document.getElementById("info");
  infoText.textContent = text;
  setTimeout(function () {
    infoText.textContent = "";
  }, 3000);
}

document
  .getElementById("registerForm")
  .addEventListener("submit", async (e) => {
    // Formulario de registro
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if(password.length < 16) return setInfoTextWithCooldown("Passwords can't be less than 16 characters long");

    try {
      const response = await fetch(
        `${window.location.protocol}//${window.location.hostname}/register`,
        {
          // Registrar usuario
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
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
        infoText = errorData.message;
      } else {
        let result;
        try {
          result = JSON.parse(responseText);
        } catch (e) {
          result = { message: responseText };
        }
        infoText =
          "User registered succesfully";
        const days = 7;
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        const expires = "expires=" + date.toUTCString();
        document.cookie = `username=${username}; ${expires}; path=/; samesite=Strict`; // Asignar cookies
        window.location.href = "main.html"; // Redigir a la página principal
      }
    } catch (err) {
      setInfoTextWithCooldown("Error registering account");
    }
  });

//Funciones para mantener y elegir el tema (oscuro y claro)
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
//Fin de las funciones para modificar el tema
