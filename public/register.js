const PORT = 3000; // Puerto Node

document.getElementById("registerForm").addEventListener("submit", async (e) => { // Formulario de registro
    e.preventDefault();
  
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if(password.length < 16) return document.getElementById("info").innerHTML = "Password must be 16 characters minimum";
  
    console.log(`${window.location.protocol}//${window.location.hostname}:${PORT}/register`);
    try {
      const response = await fetch(`${window.location.protocol}//${window.location.hostname}:${PORT}/register`, { // Registrar usuario
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });
  
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
        document.getElementById("info").innerHTML = "User registered succesfully";
        const days = 7;
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        const expires = "expires=" + date.toUTCString();
        document.cookie = `username=${username}; ${expires}; path=/; samesite=Strict`; // Asignar cookies
        window.location.href = "main.html"; // Redigir a la página principal
      }
    } catch (err) {
      document.getElementById("info").innerHTML = "Error registering account";
    }
  });