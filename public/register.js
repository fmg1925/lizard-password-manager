document.getElementById("registerForm").addEventListener("submit", async (e) => { // Formulario de registro
    e.preventDefault();
  
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if(password.length < 16) return document.getElementById("info").innerHTML = "Password must be 16 characters minimum";
  
    try {
      const response = await fetch(`${window.location.protocol}//${window.location.hostname}/register`, { // Registrar usuario
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
  //Funciones para mantener y elegir el tema(oscuro y claro)
function cargarTema() {
  const tema = localStorage.getItem("DarkMode");
  const selectdark = document.getElementById('mode-select');
  if(tema == "true") {
    selectdark.value = 2;
  }
  reloadPage();
}

 function reloadPage(){
  const selectdark = document.getElementById('mode-select');
  DM = selectdark.value;
  let header = document.getElementById("Header");
  let Ubutt = document.getElementById("user-button");
  let SelButt = document.querySelectorAll("select, button")
  if (DM == 1){
            localStorage.setItem(
              "DarkMode", false
            )
            document.body.classList.remove("dark-mode");
            header.classList.remove("dark-mode");
            Ubutt.classList.remove("dark-mode");
            SelButt.forEach((element) => {
            element.classList.remove("dark-mode");
    });
          }
          else{
            localStorage.setItem(
              "DarkMode", true
            )
            document.body.classList.add("dark-mode");
            header.classList.add("dark-mode");
            Ubutt.classList.add("dark-mode");
            SelButt.forEach((element) => {
            element.classList.add ("dark-mode");;
    });
          }
 }

 document.addEventListener("DOMContentLoaded", cargarTema);
 //Fin de las funciones para modificar el tema
