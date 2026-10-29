// frontend/script.js — login page brain (Google + gated email + forgot toggle)

console.log("script.js LOADED OK");

// Jump to the café menu, remembering who logged in
function goToMenu(user) {
  localStorage.setItem("janeUser", JSON.stringify(user || {}));
  window.location.href = "index.html";
}

// 1) GOOGLE login — Google calls this the moment you pick your account
function handleCredentialResponse(response) {
  let profile = {};
  try {
    const payload = JSON.parse(atob(response.credential.split(".")[1]));
    profile = { name: payload.name, email: payload.email, picture: payload.picture };
  } catch (e) {
    console.warn("Could not read Google profile:", e);
  }
  goToMenu(profile);
}

// 2) Page-ready wiring: email login (server-gated) + forgot-password toggle
document.addEventListener("DOMContentLoaded", function () {
  // --- dark email/password button: only enters if the server says yes ---
  const form = document.getElementById("loginForm");
  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      const email = form.querySelector('input[type="email"]').value.trim();
      const password = form.querySelector('input[type="password"]').value;
      if (!email || !password) return;
      try {
        const res = await fetch("http://localhost:8080/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (res.status === 404) {
          alert("Email login isn't set up on the server yet — please use Google.");
          return;
        }
        if (!res.ok) {
          alert("Wrong email or password.");
          return;
        }
        const user = await res.json();
        goToMenu(user);
      } catch (err) {
        alert("Couldn't reach the login server — please use Google.");
      }
    });
  }

  // --- "Forgot Password?" link: toggle ONE honest note (no duplicates) ---
  const forgot = document.querySelector(".forgot-pass");
  if (forgot) {
    let note = null;
    forgot.addEventListener("click", function (e) {
      e.preventDefault();
      if (!note) {
        note = document.createElement("p");
        note.textContent =
          "Jane Café signs you in with Google, so there's no separate password to reset. " +
          "Use the Google account you ordered with, or ask the counter for help.";
        note.style.cssText =
          "color:#8c6a4d;font-size:13px;margin:8px 0 0;text-align:center;";
        forgot.insertAdjacentElement("afterend", note);
        return;
      }
      note.hidden = !note.hidden;
    });
  }
});