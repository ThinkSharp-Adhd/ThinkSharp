const auth = firebase.auth();

const questions = [
  {
    question: "How often do you find it difficult to focus on tasks?",
    options: ["Never", "Rarely", "Sometimes", "Often", "Always"],
    scores: [0, 1, 2, 3, 4]
  },
  {
    question: "Do you often lose things needed for tasks or activities?",
    options: ["Never", "Rarely", "Sometimes", "Often", "Always"],
    scores: [0, 1, 2, 3, 4]
  },
  {
    question: "How often do you feel restless or fidgety?",
    options: ["Never", "Rarely", "Sometimes", "Often", "Always"],
    scores: [0, 1, 2, 3, 4]
  },
  {
    question: "How often do you have trouble organizing tasks or activities?",
    options: ["Never", "Rarely", "Sometimes", "Often", "Always"],
    scores: [0, 1, 2, 3, 4]
  },
  {
    question: "Do you often interrupt others or have trouble waiting your turn?",
    options: ["Never", "Rarely", "Sometimes", "Often", "Always"],
    scores: [0, 1, 2, 3, 4]
  }
];

const tasks = [
  "Try a 5-minute meditation to improve focus.",
  "Use the Pomodoro technique: 25-minute work sessions with 5-minute breaks.",
  "Organize your workspace to reduce distractions.",
  "Write down tasks in a planner to stay on track.",
  "Practice deep breathing when feeling restless."
];

window.onload = () => {
  const emailInput = document.getElementById("email");
  const sendLinkBtn = document.getElementById("send-link");
  const messageDiv = document.getElementById("auth-message");
  const authSection = document.getElementById("auth-section");
  const quizSection = document.getElementById("quiz");
  const resultScreen = document.getElementById("result-screen");
  const signOutBtn = document.getElementById("sign-out-btn");
  const settingsBtn = document.getElementById("settings-btn");
  const retakeBtn = document.getElementById("retake-btn");
  const closeSettingsBtn = document.getElementById("close-settings-btn");
  const darkModeToggle = document.getElementById("darkModeToggle");

  const showMessage = (msg, isError = false) => {
    messageDiv.textContent = msg;
    messageDiv.style.color = isError ? "red" : "green";
  };

  sendLinkBtn.addEventListener("click", () => {
    const email = emailInput.value.trim();
    if (!email) return showMessage("Please enter your email.", true);

    const actionCodeSettings = {
      url: 'https://thinksharp-adhd.github.io/ThinkSharp/',
      handleCodeInApp: true,
    };

    auth
      .sendSignInLinkToEmail(email, actionCodeSettings)
      .then(() => {
        window.localStorage.setItem("emailForSignIn", email);
        showMessage("Sign-in link sent! Check your inbox or spam folder.");
      })
      .catch((error) => {
        console.error(error);
        showMessage(`Failed to send sign-in link: ${error.message}`, true);
      });
  });

  if (auth.isSignInWithEmailLink(window.location.href)) {
    let email = window.localStorage.getItem("emailForSignIn");
    if (!email) {
      email = window.prompt("Please provide your email for confirmation.");
    }

    auth
      .signInWithEmailLink(email, window.location.href)
      .then(() => {
        window.localStorage.removeItem("emailForSignIn");
        authSection.classList.add("hidden");
        quizSection.classList.remove("hidden");
        startQuiz();
      })
      .catch((error) => {
        console.error("Sign-in error", error);
        showMessage(`Sign-in failed: ${error.message}`, true);
      });
  }

  auth.onAuthStateChanged(user => {
    if (user) {
      authSection.classList.add("hidden");
      quizSection.classList.remove("hidden");
      resultScreen.classList.add("hidden");
      startQuiz();
    } else {
      authSection.classList.remove("hidden");
      quizSection.classList.add("hidden");
      resultScreen.classList.add("hidden");
    }
  });

  signOutBtn.addEventListener("click", () => {
    auth.signOut()
      .then(() => {
        showMessage("Signed out successfully");
        authSection.classList.remove("hidden");
        quizSection.classList.add("hidden");
        resultScreen.classList.add("hidden");
      })
      .catch(error => {
        showMessage(`Sign-out failed: ${error.message}`, true);
      });
  });

  settingsBtn.onclick = () => document.getElementById("settings-modal").classList.remove("hidden");
  closeSettingsBtn.onclick = () => document.getElementById("settings-modal").classList.add("hidden");
  retakeBtn.onclick = () => {
    startQuiz();
    document.getElementById("settings-modal").classList.add("hidden");
  };

  darkModeToggle.onchange = () => {
    document.body.classList.toggle("dark", darkModeToggle.checked);
    document.getElementById("app").classList.toggle("dark", darkModeToggle.checked);
    localStorage.setItem("darkMode", darkModeToggle.checked);
  };

  if (localStorage.getItem("darkMode") === "true") {
    darkModeToggle.checked = true;
    document.body.classList.add("dark");
    document.getElementById("app").classList.add("dark");
  }
};

function startQuiz() {
  let currentQuestion = 0;
  let score = 0;
  const maxScore = questions.length * 4;
  const questionEl = document.getElementById("question");
  const optionsEl = document.getElementById("options");
  const scoreEl = document.getElementById("score");
  const xpLevelEl = document.getElementById("xpLevel");
  const xpProgressEl = document.getElementById("xpProgress");
  const tasksEl = document.getElementById("tasks");
  const quizSection = document.getElementById("quiz");
  const resultScreen = document.getElementById("result-screen");
  const loader = document.getElementById("loader");

  function loadQuestion() {
    loader.classList.add("hidden");
    quizSection.classList.remove("hidden");
    resultScreen.classList.add("hidden");
    const q = questions[currentQuestion];
    questionEl.textContent = q.question;
    optionsEl.innerHTML = "";
    q.options.forEach((option, index) => {
      const btn = document.createElement("button");
      btn.textContent = option;
      btn.className = "circle bg-blue-100 hover:bg-blue-200 text-sm p-2 rounded-lg transition-colors duration-200";
      btn.onclick = () => {
        score += q.scores[index];
        currentQuestion++;
        if (currentQuestion < questions.length) {
          loadQuestion();
          const partyPopper = document.createElement("div");
          partyPopper.className = "party-popper";
          partyPopper.textContent = "🎉";
          partyPopper.style.left = `${Math.random() * 80 + 10}%`;
          document.getElementById("app").appendChild(partyPopper);
          setTimeout(() => partyPopper.remove(), 1000);
        } else {
          showResult();
        }
      };
      optionsEl.appendChild(btn);
    });
  }

  function showResult() {
    quizSection.classList.add("hidden");
    resultScreen.classList.remove("hidden");
    const percentage = (score / maxScore) * 100;
    scoreEl.textContent = `Score: ${score}/${maxScore}`;
    xpLevelEl.textContent = `Focus Level: ${getLevel(percentage)}`;
    xpProgressEl.style.width = `${percentage}%`;
    tasksEl.innerHTML = tasks.map(task => `<div class="task-item text-sm text-gray-700 dark:text-gray-300">${task}</div>`).join("");
  }

  function getLevel(percentage) {
    if (percentage < 33) return "Beginner";
    if (percentage < 66) return "Intermediate";
    return "Advanced";
  }

  loadQuestion();
}