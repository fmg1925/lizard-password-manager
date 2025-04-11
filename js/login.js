document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("http://localhost:3000/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    // Log the response text for debugging purposes
    const responseText = await response.text();
    console.log("Server response:", responseText);

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
      // Set a cookie valid for 7 days
      const days = 7;
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      const expires = "expires=" + date.toUTCString();
      document.cookie = `username=${username}; ${expires}; path=/; samesite=Strict`;
      window.location.href = "main.html";
    }
  } catch (err) {
    console.error("Error during login:", err);
    alert("An error occurred during login. Please try again later.");
  }
});