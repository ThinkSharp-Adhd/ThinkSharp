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

const sendLinkBtn = document.getElementById('send-link');
const signOutBtn = document.getElementById('sign-out-btn');
const emailInput = document.getElementById('email');
const authMessage = document.getElementById('auth-message');
const authSection = document.getElementById('auth-section');
const quizSection = document.getElementById('quiz');
const resultSection = document.getElementById('result-screen');
const questionEl = document.getElementById('question');
const optionsEl = document.getElementById('options');
const xpLevel = document.getElementById('xpLevel');
const xpProgress = document.getElementById('xpProgress');
const scoreEl = document.getElementById('score');
const tasksEl = document.getElementById('tasks');

const questions = [
  { question: "How often do you get distracted?", options: ["Never","Rarely","Sometimes","Often","Always"] },
  { question: "How often do you forget tasks?", options: ["Never","Rarely","Sometimes","Often","Always"] }
];
let current = 0, totalScore = 0;

function startQuiz() {
  current = 0; totalScore = 0;
  quizSection.classList.remove('hidden');
  authSection.classList.add('hidden');
  nextQ();
}
function nextQ(){
  const q = questions[current];
  questionEl.textContent = q.question;
  optionsEl.innerHTML = '';
  q.options.forEach((opt,i)=>{
    const btn = document.createElement('button');
    btn.textContent = opt;
    btn.className = "py-2 bg-gray-200 rounded hover:bg-gray-300";
    btn.onclick = ()=>{
      totalScore+=i;
      current++;
      current<questions.length? nextQ() : endQuiz();
    };
    optionsEl.appendChild(btn);
  });
}
function endQuiz(){
  quizSection.classList.add('hidden');
  xpLevel.textContent = `Level ${Math.floor(totalScore/(questions.length*2))+1}`;
  const pct = Math.round(totalScore/(questions.length*4)*100);
  xpProgress.style.width = pct + '%';
  scoreEl.textContent = `Score: ${totalScore}/${questions.length*4}`;
  tasksEl.innerHTML = `<li>Try Pomodoro</li><li>Break tasks small</li>`;
  resultSection.classList.remove('hidden');
}

sendLinkBtn.onclick = ()=>{
  const email = emailInput.value.trim();
  if(!email){ authMessage.textContent='Enter email'; return; }
  const actionCodeSettings = {
    url: location.href,
    handleCodeInApp: true
  };
  auth.sendSignInLinkToEmail(email, actionCodeSettings)
    .then(()=>{ authMessage.textContent='Link sent!'; localStorage.setItem('emailForSignIn', email); })
    .catch(e=>authMessage.textContent = 'Error: '+e.message);
};
if(auth.isSignInWithEmailLink(location.href)){
  let email = localStorage.getItem('emailForSignIn') || prompt('Email?');
  auth.signInWithEmailLink(email, location.href)
    .catch(e=>authMessage.textContent = 'Error: '+e.message);
}

auth.onAuthStateChanged(user=>{
  if(user){ startQuiz(); }
  else {
    authSection.classList.remove('hidden');
    quizSection.classList.add('hidden');
    resultSection.classList.add('hidden');
  }
});

signOutBtn.onclick = ()=>{
  auth.signOut().then(() => {
    authSection.classList.remove('hidden');
    quizSection.classList.add('hidden');
    resultSection.classList.add('hidden');
    authMessage.textContent = 'Signed out';
  });
};
