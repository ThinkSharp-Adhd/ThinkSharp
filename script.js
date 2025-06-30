// === Firebase Initialization ===
const firebaseConfig = {
  apiKey: "AIzaSyBlgQqPVQjAr_edKWGiVmS5hIGGCXRU9Vc",
  authDomain: "website-login-8697b.firebaseapp.com",
  projectId: "website-login-8697b",
  storageBucket: "website-login-8697b.appspot.com",
  messagingSenderId: "154630434494",
  appId: "1:154630434494:web:6e51f148e5a5a6ff9938ef",
  measurementId: "G-919YBWXJZH"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// === DOM Elements ===
const sendLinkBtn = document.getElementById('send-link');
const signOutBtn = document.getElementById('sign-out-btn');
const emailInput = document.getElementById('email');
const authMessage = document.getElementById('auth-message');
const authSection = document.getElementById('auth-section');
const quizSection = document.getElementById('quiz');
const resultSection = document.getElementById('result-screen');
const xpBar = document.getElementById('xpProgress');
const xpLevel = document.getElementById('xpLevel');
const scoreDisplay = document.getElementById('score');
const tasksContainer = document.getElementById('tasks');

// === Firebase Email Link Sign-In ===
sendLinkBtn.addEventListener('click', () => {
  const email = emailInput.value.trim();
  if (!email) {
    authMessage.textContent = 'Please enter an email.';
    return;
  }

  const actionCodeSettings = {
    url: 'https://thinksharp-adhd.github.io/ThinkSharp/',
    handleCodeInApp: true,
  };

  auth.sendSignInLinkToEmail(email, actionCodeSettings)
    .then(() => {
      authMessage.textContent = 'Sign-in link sent! Check inbox/spam.';
      localStorage.setItem('emailForSignIn', email);
    })
    .catch(error => {
      authMessage.textContent = `Error: ${error.message}`;
      console.error(error);
    });
});

// Handle incoming link sign-in
if (auth.isSignInWithEmailLink(window.location.href)) {
  const email = localStorage.getItem('emailForSignIn');
  if (email) {
    auth.signInWithEmailLink(email, window.location.href)
      .then(() => {
        localStorage.removeItem('emailForSignIn');
        showQuiz();
      })
      .catch(error => {
        authMessage.textContent = `Sign-in error: ${error.message}`;
      });
  } else {
    authMessage.textContent = 'Please enter your email to complete sign-in.';
  }
}

auth.onAuthStateChanged(user => {
  if (user) {
    showQuiz();
  } else {
    showAuth();
  }
});

signOutBtn.addEventListener('click', () => {
  auth.signOut().then(() => {
    showAuth();
  });
});

function showQuiz() {
  authSection.classList.add('hidden');
  quizSection.classList.remove('hidden');
  resultSection.classList.add('hidden');
  startQuiz();
}

function showAuth() {
  authSection.classList.remove('hidden');
  quizSection.classList.add('hidden');
  resultSection.classList.add('hidden');
}

// === Quiz System ===
const questions = [
  { text: "How often do you get distracted while doing a task?", level: "focus" },
  { text: "How often do you forget daily responsibilities?", level: "memory" },
  { text: "How hard is it to stay still for long periods?", level: "impulse" },
  { text: "Do you jump between tasks without finishing?", level: "focus" }
];

let currentQuestion = 0;
let totalScore = 0;

function startQuiz() {
  currentQuestion = 0;
  totalScore = 0;
  renderQuestion();
}

function renderQuestion() {
  const q = questions[currentQuestion];
  document.getElementById("question").innerText = q.text;

  const optionsContainer = document.getElementById("options");
  optionsContainer.innerHTML = "";

  const choices = ["Never", "Rarely", "Sometimes", "Often", "Always"];

  choices.forEach((text, index) => {
    const btn = document.createElement("button");
    btn.innerText = text;
    btn.className = "bg-gray-200 hover:bg-blue-400 text-sm sm:text-base px-3 py-2 rounded w-full sm:w-[18%]";
    btn.addEventListener("click", () => {
      totalScore += index;
      currentQuestion++;
      if (currentQuestion < questions.length) {
        renderQuestion();
      } else {
        finishQuiz();
      }
    });
    optionsContainer.appendChild(btn);
  });
}

function finishQuiz() {
  quizSection.classList.add("hidden");
  resultSection.classList.remove("hidden");

  // XP logic
  const percent = Math.min((totalScore / (questions.length * 4)) * 100, 100);
  xpBar.style.width = percent + "%";
  xpLevel.innerText = `Level: ${Math.floor(percent / 20) + 1}`;
  scoreDisplay.innerText = `Focus Score: ${totalScore}/${questions.length * 4}`;

  tasksContainer.innerHTML = `
    <div class="text-sm sm:text-base">📌 Try the Pomodoro technique</div>
    <div class="text-sm sm:text-base">📋 Break big tasks into small chunks</div>
    <div class="text-sm sm:text-base">🎯 Set clear goals for today</div>
  `;
}

// === Settings Modal ===
document.getElementById("settings-btn").addEventListener("click", () => {
  document.getElementById("settings-modal").classList.remove("hidden");
});
document.getElementById("close-settings-btn").addEventListener("click", () => {
  document.getElementById("settings-modal").classList.add("hidden");
});
document.getElementById("retake-btn").addEventListener("click", () => {
  document.getElementById("settings-modal").classList.add("hidden");
  resultSection.classList.add("hidden");
  quizSection.classList.remove("hidden");
  startQuiz();
});

// === Dark Mode ===
const darkToggle = document.getElementById("darkModeToggle");
darkToggle.addEventListener("change", () => {
  document.body.classList.toggle("dark", darkToggle.checked);
});
