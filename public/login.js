const PORT = 3000; // Puerto Node

document.getElementById("loginForm").addEventListener("submit", async (e) => { // Formulario de inicio de sesión
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch(`${window.location.protocol}//${window.location.hostname}:${PORT}/login`, { // Iniciar sesión
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
      credentials: "include",
    });

    const responseText = await response.text();
    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        errorData = { message: responseText };
      }
      document.getElementById("info").innerHTML = "Incorrect username or password";
    } else {
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        result = { message: responseText };
      }
      document.getElementById("info").innerHTML = result.message;
      const days = 7;
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      const expires = "expires=" + date.toUTCString();
      document.cookie = `username=${username}; ${expires}; path=/; samesite=Strict`; // Asignar (o renovar) cookies
      window.location.href = "main.html"; // Redirigir a página principal
    }
  } catch (err) {
    console.error("Error during login:", err);
    document.getElementById("info").innerHTML = "Error encountered while logging in";
  }
});