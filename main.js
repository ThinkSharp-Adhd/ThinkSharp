// Firebase config
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

// DOM elements
const sendLinkBtn = document.getElementById('send-link');
const signOutBtn = document.getElementById('sign-out-btn');
const emailInput = document.getElementById('email');
const authMessage = document.getElementById('auth-message');
const authSection = document.getElementById('auth-section');
const quizSection = document.getElementById('quiz');
const resultSection = document.getElementById('result-screen');

// Quiz data
const questions = [
  { question: "Do you find it hard to focus for long periods?", options: ["Never", "Rarely", "Sometimes", "Often", "Always"] },
  { question: "How often do you lose track of tasks?", options: ["Never", "Rarely", "Sometimes", "Often", "Always"] }
];

let currentQuestionIndex = 0;

function startQuiz() {
  currentQuestionIndex = 0;
  showQuestion();
}

function showQuestion() {
  const questionObj = questions[currentQuestionIndex];
  const questionEl = document.getElementById('question');
  const optionsEl = document.getElementById('options');

  questionEl.textContent = questionObj.question;
  optionsEl.innerHTML = "";

  questionObj.options.forEach(option => {
    const btn = document.createElement("button");
    btn.textContent = option;
    btn.className = "bg-blue-200 hover:bg-blue-300 px-3 py-1 rounded m-1";
    btn.addEventListener("click", () => {
      currentQuestionIndex++;
      if (currentQuestionIndex < questions.length) {
        showQuestion();
      } else {
        showResults();
      }
    });
    optionsEl.appendChild(btn);
  });
}

function showResults() {
  quizSection.classList.add("hidden");
  resultSection.classList.remove("hidden");
  document.getElementById("score").textContent = "Well done! 🎯";
}

// Send sign-in link
sendLinkBtn.addEventListener('click', () => {
  const email = emailInput.value.trim();
  if (!email) {
    authMessage.textContent = 'Please enter an email';
    return;
  }

  const actionCodeSettings = {
    url: 'https://thinksharp-adhd.github.io/ThinkSharp/',
    handleCodeInApp: true
  };

  auth.sendSignInLinkToEmail(email, actionCodeSettings)
    .then(() => {
      authMessage.textContent = 'Link sent! Check your inbox.';
      window.localStorage.setItem('emailForSignIn', email);
    })
    .catch(error => {
      authMessage.textContent = `Error: ${error.message}`;
      console.error(error);
    });
});

// Handle login from email link
if (auth.isSignInWithEmailLink(window.location.href)) {
  let email = window.localStorage.getItem('emailForSignIn');
  if (!email) {
    email = window.prompt('Please provide your email for confirmation');
  }

  auth.signInWithEmailLink(email, window.location.href)
    .then(() => {
      window.localStorage.removeItem('emailForSignIn');
      authMessage.textContent = 'Signed in!';
      authSection.classList.add('hidden');
      quizSection.classList.remove('hidden');
      startQuiz();
    })
    .catch(error => {
      authMessage.textContent = `Sign-in error: ${error.message}`;
      console.error(error);
    });
}

// Auth state change
auth.onAuthStateChanged(user => {
  if (user) {
    authSection.classList.add('hidden');
    quizSection.classList.remove('hidden');
    resultSection.classList.add('hidden');
    startQuiz();
  } else {
    authSection.classList.remove('hidden');
    quizSection.classList.add('hidden');
    resultSection.classList.add('hidden');
  }
});

// Sign-out
signOutBtn?.addEventListener('click', () => {
  auth.signOut()
    .then(() => {
      authMessage.textContent = 'Signed out';
      authSection.classList.remove('hidden');
      quizSection.classList.add('hidden');
      resultSection.classList.add('hidden');
    })
    .catch(error => {
      authMessage.textContent = `Error: ${error.message}`;
      console.error(error);
    });
});
