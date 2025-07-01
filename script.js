// Firebase Authentication
const auth = firebase.auth();

window.onload = () => {
  const emailInput = document.getElementById("email");
  const sendLinkBtn = document.getElementById("send-link");
  const messageDiv = document.getElementById("auth-message");
  const authSection = document.getElementById("auth-section");
  const quizSection = document.getElementById("quiz");
  const resultScreen = document.getElementById("result-screen");

  // Show message
  const showMessage = (msg, isError = false) => {
    messageDiv.innerText = msg;
    messageDiv.style.color = isError ? "red" : "green";
  };

  // Send Email Link
  sendLinkBtn.addEventListener("click", () => {
    const email = emailInput.value;
    if (!email) return showMessage("Please enter your email.", true);

    const actionCodeSettings = {
      url: window.location.href,
      handleCodeInApp: true,
    };

    auth
      .sendSignInLinkToEmail(email, actionCodeSettings)
      .then(() => {
        window.localStorage.setItem("emailForSignIn", email);
        showMessage("Sign-in link sent! Check your inbox.");
      })
      .catch((error) => {
        console.error(error);
        showMessage("Failed to send sign-in link.", true);
      });
  });

  // Sign in if returning from email
  if (auth.isSignInWithEmailLink(window.location.href)) {
    let email = window.localStorage.getItem("emailForSignIn");
    if (!email) {
      email = window.prompt("Please provide your email for confirmation.");
    }

    auth
      .signInWithEmailLink(email, window.location.href)
      .then((result) => {
        window.localStorage.removeItem("emailForSignIn");
        authSection.style.display = "none";
        quizSection.classList.remove("hidden");
        startQuiz();
      })
      .catch((error) => {
        console.error("Sign-in error", error);
        showMessage("Sign-in failed.", true);
      });
  }
};

// Your quiz logic goes here:
function startQuiz() {
  console.log("Quiz started!");
  document.getElementById("question").innerText = "Q1: Do you get distracted easily?";
  const options = document.getElementById("options");
  options.innerHTML = "";
  ["Never", "Rarely", "Sometimes", "Often", "Always"].forEach((label) => {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.className = "circle bg-blue-100 hover:bg-blue-200 text-sm p-2 rounded-lg";
    options.appendChild(btn);
  });
}
