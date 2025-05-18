<script type="module">
  // Import Firebase SDK modules
  import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
  import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
  import { getFirestore, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
  import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js';

  // Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyBlgQqPVQjAr_edKWGiVmS5hIGGCXRU9Vc",
    authDomain: "website-login-8697b.firebaseapp.com",
    projectId: "website-login-8697b",
    storageBucket: "website-login-8697b.firebasestorage.app",
    messagingSenderId: "154630434494",
    appId: "1:154630434494:web:1318fa05715939809938ef",
    measurementId: "G-Y1SW4V8THL"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const analytics = getAnalytics(app);
  const provider = new GoogleAuthProvider();
  console.log("Firebase initialized:", app);

  // Questions and tasks
  const questions = [
    { q: "You find it hard to sit still for long periods.", scores: [0, 1, 2, 3, 4] },
    { q: "You get distracted easily during tasks.", scores: [0, 1, 2, 3, 4] },
    { q: "You have trouble organizing tasks or activities.", scores: [0, 1, 2, 3, 4] },
    { q: "You frequently forget things like appointments or obligations.", scores: [0, 1, 2, 3, 4] },
    { q: "You feel like your thoughts are racing and hard to control.", scores: [0, 1, 2, 3, 4] }
  ];
  const tasksBySeverity = {
    mild: [
      { text: "Try a 5-minute mindfulness breathing exercise after each task.", action: 'meditation' },
      { text: "Use a Pomodoro timer: 25 minutes focus, 5 minutes break.", action: 'pomodoro' },
      { text: "Keep a notepad for quick jotting of to-dos.", action: 'notepad' }
    ],
    moderate: [
      { text: "Designate a distraction-free workspace with minimal stimuli.", action: 'workspace' },
      { text: "Create a daily checklist each morning and tick off items.", action: 'checklist' },
      { text: "Use a focus-blocking app for 45-minute sessions.", action: 'focusBlock' }
    ],
    severe: [
      { text: "Break tasks into 5-minute micro-tasks and reward yourself after each.", action: 'microTask' },
      { text: "Schedule structured cycles: 15 minutes work / 5 minutes move/stretch.", action: 'workStretch' },
      { text: "Pair with an accountability buddy and check in hourly.", action: 'accountability' }
    ]
  };

  let current = 0, total = 0;
  const maxScore = questions.length * 4;
  let timerInterval = null;
  let pomodoroPhase = 'focus';
  let pomodoroCycles = 0;
  let currentActiveTask = null;
  let notepadStates = {};
  let xp = 0;
  let level = 1;
  const xpPerTask = 10;
  const xpPerLevel = 100;
  let completedTasks = [];
  let quizState = null;
  let userId = null;

  // Detect if device is mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Helper to add click and touch events
  function addInteractionListener(element, handler) {
    element.addEventListener('click', handler);
    if (isMobile) {
      element.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Prevent scroll/zoom interference
        handler(e);
      });
    }
  }

  function updateXP(addXP = 0) {
    xp += addXP;
    level = Math.floor(xp / xpPerLevel) + 1;
    saveUserData();
    const xpLevelEl = document.getElementById('xpLevel');
    const xpProgressEl = document.getElementById('xpProgress');
    if (xpLevelEl && xpProgressEl) {
      xpLevelEl.textContent = `Level ${level} - XP: ${xp % xpPerLevel}/${xpPerLevel}`;
      xpProgressEl.style.width = `${(xp % xpPerLevel) / xpPerLevel * 100}%`;
    }
    console.log("XP updated:", xp, "Level:", level);
  }

  function triggerPartyPopper(targetElement) {
    const popperContainer = document.createElement('div');
    popperContainer.style.position = 'absolute';
    popperContainer.style.left = `${targetElement.getBoundingClientRect().left}px`;
    popperContainer.style.top = `${targetElement.getBoundingClientRect().top - 20}px`;
    const emojis = ['🎉', '🥳', '🎈'];
    // Reduce number of poppers on mobile
    const popperCount = isMobile ? 5 : 10;
    for (let i = 0; i < popperCount; i++) {
      const popper = document.createElement('span');
      popper.className = 'party-popper';
      popper.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      popper.style.left = `${Math.random() * 50 - 25}px`;
      popper.style.animationDelay = `${Math.random() * 0.5}s`;
      popper.style.transform = `rotate(${Math.random() * 60 - 30}deg)`;
      popperContainer.appendChild(popper);
    }
    document.getElementById('app').appendChild(popperContainer);
    setTimeout(() => popperContainer.remove(), 2000);
  }

  function toggleDarkMode() {
    const isDark = document.getElementById('darkModeToggle').checked;
    document.getElementById('body').classList.toggle('dark', isDark);
    document.getElementById('app').classList.toggle('bg-gray-900', isDark);
    document.getElementById('app').classList.toggle('bg-white', !isDark);
    document.getElementById('app').classList.toggle('text-gray-200', isDark);
    document.getElementById('app').classList.toggle('text-gray-800', !isDark);
    localStorage.setItem('darkMode', isDark);
  }

  function openSettings() {
    document.getElementById('settings-modal').classList.remove('hidden');
  }

  function closeSettings() {
    document.getElementById('settings-modal').classList.add('hidden');
  }

  function retakeQuiz() {
    current = total = 0;
    quizState = null;
    completedTasks = [];
    notepadStates = {};
    saveUserData();
    document.getElementById('settings-modal').classList.add('hidden');
    document.getElementById('result-screen').classList.add('hidden');
    document.getElementById('quiz').classList.remove('hidden');
    document.getElementById('quiz').classList.add('fade-in');
    loadQuestion();
  }

  function signOutUser() {
    signOut(auth).then(() => {
      document.getElementById('settings-modal').classList.add('hidden');
      location.reload();
    }).catch((error) => {
      console.error("Sign-out error:", error);
    });
  }

  function loginWithGoogle() {
    console.log("Starting Google Sign-In");
    signInWithPopup(auth, provider)
      .then((result) => {
        userId = result.user.uid;
        console.log("Signed in, userId:", userId);
        document.getElementById('user-info').textContent = `Signed in as ${result.user.displayName}`;
        loadUserData();
      })
      .catch((error) => {
        console.error("Google Sign-In error:", error);
        document.getElementById('user-info').textContent = "Login failed. Try again.";
      });
  }

  async function loadUserData() {
    if (!userId) {
      console.error("No userId, starting quiz");
      startQuiz();
      return;
    }
    try {
      console.log("Fetching user data for:", userId);
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      console.log("User doc exists:", userDoc.exists());
      const userData = userDoc.exists() ? userDoc.data() : {};
      quizState = userData.quizState || null;
      completedTasks = userData.completedTasks || [];
      notepadStates = userData.notepadStates || {};
      xp = userData.xp || 0;
      level = Math.floor(xp / xpPerLevel) + 1;
      document.getElementById('login').classList.add('hidden');
      console.log("Quiz state:", quizState);
      if (quizState) {
        showResult();
      } else {
        startQuiz();
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      document.getElementById('login').classList.add('hidden');
      startQuiz();
    }
  }

  async function saveUserData() {
    if (!userId) {
      console.error("No userId, cannot save data");
      return;
    }
    try {
      console.log("Saving user data for:", userId);
      await setDoc(doc(db, 'users', userId), {
        quizState,
        completedTasks,
        notepadStates,
        xp
      }, { merge: true });
      console.log("User data saved successfully");
    } catch (error) {
      console.error("Error saving user data:", error);
    }
  }

  window.onload = () => {
    console.log("Window loaded, setting up app");
    const isDark = localStorage.getItem('darkMode') === 'true';
    document.getElementById('darkModeToggle').checked = isDark;
    document.getElementById('body').classList.toggle('dark', isDark);
    document.getElementById('app').classList.toggle('bg-gray-900', isDark);
    document.getElementById('app').classList.toggle('bg-white', !isDark);
    document.getElementById('app').classList.toggle('text-gray-200', isDark);
    document.getElementById('app').classList.toggle('text-gray-800', !isDark);

    addInteractionListener(document.getElementById('google-sign-in'), loginWithGoogle);
    document.getElementById('darkModeToggle').addEventListener('change', toggleDarkMode);
    addInteractionListener(document.getElementById('settings-btn'), openSettings);
    addInteractionListener(document.getElementById('retake-btn'), retakeQuiz);
    addInteractionListener(document.getElementById('logout-btn'), signOutUser);
    addInteractionListener(document.getElementById('close-settings-btn'), closeSettings);

    onAuthStateChanged(auth, user => {
      console.log("Auth state changed, user:", user ? user.uid : "none");
      if (user) {
        userId = user.uid;
        document.getElementById('user-info').textContent = `Signed in as ${user.displayName}`;
        loadUserData();
      } else {
        document.getElementById('loader').classList.add('loader-hidden');
        document.getElementById('login').classList.remove('hidden');
        document.getElementById('user-info').textContent = "Please sign in.";
      }
    });
  };

  function startQuiz() {
    console.log("Starting quiz");
    document.getElementById('loader').classList.add('loader-hidden');
    setTimeout(() => {
      document.getElementById('quiz').classList.remove('hidden');
      document.getElementById('quiz').classList.add('fade-in');
      loadQuestion();
    }, 1500);
  }

  function loadQuestion() {
    const q = questions[current];
    if (!q) {
      console.error('Question not found for index:', current);
      return;
    }
    console.log("Loading question:", current + 1);
    document.getElementById('loader').classList.add('loader-hidden');
    const questionEl = document.getElementById('question');
    questionEl.innerHTML = `<p class="slide-in">${q.q}</p>`;
    const opts = document.getElementById('options');
    opts.innerHTML = '';
    ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'].forEach((label, i) => {
      const c = document.createElement('div');
      c.className = `circle rounded-full ${['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400', 'bg-blue-400'][i]} flex items-center justify-center text-white font-semibold`;
      c.setAttribute('title', label);
      c.textContent = label.charAt(0);
      c.dataset.index = i; // Store index for event delegation
      opts.appendChild(c);
    });
    // Use event delegation for quiz options
    addInteractionListener(opts, (e) => {
      const circle = e.target.closest('.circle');
      if (circle && !circle.classList.contains('disabled')) {
        const idx = parseInt(circle.dataset.index);
        select(idx);
      }
    });
    setTimeout(() => {
      opts.querySelectorAll('.circle').forEach((el, i) => {
        el.style.animationDelay = `${i * 0.1}s`;
        el.classList.add('slide-in');
      });
    }, 10);
  }

  function select(idx) {
    total += questions[current].scores[idx];
    console.log("Selected option:", idx, "Score:", questions[current].scores[idx], "Total:", total);
    current++;
    if (current < questions.length) {
      loadQuestion();
    } else {
      showResult();
    }
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  function startTimer(duration, display, onEnd, onTick = () => {}) {
    let timeLeft = duration;
    display.textContent = formatTime(timeLeft);
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      timeLeft--;
      display.textContent = formatTime(timeLeft);
      onTick();
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        onEnd();
      }
    }, 1000);
  }

  function disableTaskButtons(exceptIndex = null) {
    document.querySelectorAll('.task-item button:not(.retake-btn)').forEach(btn => {
      if (exceptIndex !== null && btn.parentElement.id.includes(`${exceptIndex}`)) return;
      btn.classList.add('disabled');
    });
  }

  function enableTaskButtons() {
    document.querySelectorAll('.task-item button').forEach(btn => {
      if (!btn.classList.contains('completed')) {
        btn.classList.remove('disabled');
      }
    });
  }

  function markTaskCompleted(taskId, button) {
    if (!completedTasks.includes(taskId)) {
      completedTasks.push(taskId);
      saveUserData();
      if (button) {
        button.classList.add('disabled', 'completed');
        button.textContent = 'Completed';
      }
      checkAllTasksCompleted();
    }
    console.log("Task completed:", taskId);
  }

  function checkAllTasksCompleted() {
    const allCompleted = quizState.tasks.every((task, i) => completedTasks.includes(`${task.action}${i}`));
    if (allCompleted) {
      const tasksEl = document.getElementById('tasks');
      const refreshButton = document.createElement('button');
      refreshButton.className = 'w-full py-[1vh] mt-[2vh] bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-[1rem]';
      refreshButton.textContent = 'Get New Tasks';
      addInteractionListener(refreshButton, resetTasks);
      tasksEl.appendChild(refreshButton);
    }
  }

  function resetTasks() {
    completedTasks = [];
    saveUserData();
    showResult();
    console.log("Tasks reset");
  }

  function showResult() {
    console.log("Showing result, total score:", total);
    document.getElementById('quiz').classList.add('hidden');
    document.getElementById('loader').classList.add('loader-hidden');
    let percent, severity;
    if (quizState) {
      percent = quizState.percent;
      severity = quizState.severity;
    } else {
      percent = Math.round((total / maxScore) * 100);
      severity = percent < 40 ? 'mild' : percent <= 70 ? 'moderate' : 'severe';
      quizState = { percent, severity, tasks: tasksBySeverity[severity] };
      saveUserData();
    }
    const scoreEl = document.getElementById('score');
    scoreEl.textContent = `Focus Score: ${percent}%`;
    scoreEl.className = `quiz-result text-[1.5rem] sm:text-[2rem] font-bold text-center mb-[2vh] fade-in ${percent < 40 ? 'text-green-500' : percent <= 70 ? 'text-yellow-500' : 'text-red-500'}`;
    updateXP(0);

    const tasksEl = document.getElementById('tasks');
    tasksEl.innerHTML = '';
    quizState.tasks.forEach((task, i) => {
      const div = document.createElement('div');
      div.className = 'task-item flex items-center space-x-[1vw] slide-in';
      div.id = `task-${i}`;
      div.style.animationDelay = `${i * 0.2}s`;
      let actionHtml = '';
      const taskId = `${task.action}${i}`;
      const isCompleted = completedTasks.includes(taskId);
      if (task.action === 'meditation') {
        actionHtml = `
          <button id="meditation-start-${i}" class="ml-[1vw] py-[0.5rem] px-[1rem] bg-blue-500 text-white rounded hover:bg-blue-600 ${isCompleted ? 'disabled completed' : ''}">${isCompleted ? 'Completed' : 'Start'}</button>
          <div id="meditationTimer${i}" class="hidden ml-[1vw]">
            <span id="meditationDisplay${i}" class="text-[0.9rem]"></span>
            <button id="meditation-stop-${i}" class="ml-[1vw] py-[0.5rem] px-[1rem] bg-red-500 text-white rounded hover:bg-red-600">Stop</button>
          </div>`;
      } else if (task.action === 'pomodoro') {
        actionHtml = `
          <button id="pomodoro-start-${i}" class="ml-[1vw] py-[0.5rem] px-[1rem] bg-blue-500 text-white rounded hover:bg-blue-600 ${isCompleted ? 'disabled completed' : ''}">${isCompleted ? 'Completed' : 'Start'}</button>
          <div id="pomodoroTimer${i}" class="hidden ml-[1vw]">
            <span id="pomodoroDisplay${i}" class="text-[0.9rem]"></span>
            <button id="pomodoro-stop-${i}" class="ml-[1vw] py-[0.5rem] px-[1rem] bg-red-500 text-white rounded hover:bg-red-600">Stop</button>
          </div>`;
      } else if (task.action === 'notepad') {
        actionHtml = `
          <div class="ml-[1vw] w-full">
            <textarea id="notepad${i}" class="w-[60vw] p-[0.5rem] border rounded text-[0.9rem] dark:bg-gray-700 dark:text-gray-200" placeholder="Jot down your to-dos..."></textarea>
            <div class="flex space-x-[1vw] mt-[0.5vh]">
              <button id="notepad-save-${i}" class="py-[0.5rem] px-[1rem] bg-blue-500 text-white rounded hover:bg-blue-600 ${isCompleted ? 'disabled completed' : ''}">${isCompleted ? 'Completed' : 'Save'}</button>
              <button id="notepad-clear-${i}" class="py-[0.5rem] px-[1rem] bg-gray-500 text-white rounded hover:bg-gray-600">Clear</button>
            </div>
            <div id="notepadList${i}" class="mt-[1vh] text-[0.9rem]"></div>
          </div>`;
      } else if (task.action === 'workspace') {
        actionHtml = `
          <p class="ml-[1vw] text-[0.9rem] italic dark:text-gray-300">Clear your desk and silence notifications!</p>
          <button id="workspace-complete-${i}" class="ml-[1vw] py-[0.5rem] px-[1rem] bg-blue-500 text-white rounded hover:bg-blue-600 ${isCompleted ? 'disabled completed' : ''}">${isCompleted ? 'Completed' : 'Mark as Completed'}</button>`;
      } else if (task.action === 'checklist') {
        actionHtml = `
          <div class="ml-[1vw]">
            <input id="checklistInput${i}" class="p-[0.5rem] border rounded text-[0.9rem] dark:bg-gray-700 dark:text-gray-200" placeholder="Add task...">
            <button id="checklist-add-${i}" class="ml-[0.5vw] py-[0.5rem] px-[1rem] bg-blue-500 text-white rounded hover:bg-blue-600 ${isCompleted ? 'disabled completed' : ''}">${isCompleted ? 'Completed' : 'Add'}</button>
            <div id="checklist${i}" class="mt-[1vh]"></div>
          </div>`;
      } else if (task.action === 'focusBlock') {
        actionHtml = `
          <button id="focusBlock-start-${i}" class="ml-[1vw] py-[0.5rem] px-[1rem] bg-blue-500 text-white rounded hover:bg-blue-600 ${isCompleted ? 'disabled completed' : ''}">${isCompleted ? 'Completed' : 'Start'}</button>
          <div id="focusBlockTimer${i}" class="hidden ml-[1vw]">
            <span id="focusBlockDisplay${i}" class="text-[0.9rem]"></span>
            <button id="focusBlock-stop-${i}" class="ml-[1vw] py-[0.5rem] px-[1rem] bg-red-500 text-white rounded hover:bg-red-600">Stop</button>
          </div>`;
      } else if (task.action === 'microTask') {
        actionHtml = `
          <button id="microTask-start-${i}" class="ml-[1vw] py-[0.5rem] px-[1rem] bg-blue-500 text-white rounded hover:bg-blue-600 ${isCompleted ? 'disabled completed' : ''}">${isCompleted ? 'Completed' : 'Start'}</button>
          <div id="microTaskTimer${i}" class="hidden ml-[1vw]">
            <span id="microTaskDisplay${i}" class="text-[0.9rem]"></span>
            <button id="microTask-complete-${i}" class="ml-[1vw] py-[0.5rem] px-[1rem] bg-green-500 text-white rounded hover:bg-green-600">Done</button>
            <button id="microTask-stop-${i}" class="ml-[1vw] py-[0.5rem] px-[1rem] bg-red-500 text-white rounded hover:bg-red-600">Stop</button>
          </div>`;
      } else if (task.action === 'workStretch') {
        actionHtml = `
          <button id="workStretch-start-${i}" class="ml-[1vw] py-[0.5rem] px-[1rem] bg-blue-500 text-white rounded hover:bg-blue-600 ${isCompleted ? 'disabled completed' : ''}">${isCompleted ? 'Completed' : 'Start'}</button>
          <div id="workStretchTimer${i}" class="hidden ml-[1vw]">
            <span id="workStretchDisplay${i}" class="text-[0.9rem]"></span>
            <button id="workStretch-stop-${i}" class="ml-[1vw] py-[0.5rem] px-[1rem] bg-red-500 text-white rounded hover:bg-red-600">Stop</button>
          </div>`;
      } else if (task.action === 'accountability') {
        actionHtml = `
          <input id="accountability${i}" class="ml-[1vw] p-[0.5rem] border rounded text-[0.9rem] dark:bg-gray-700 dark:text-gray-200" placeholder="Enter buddy's contact info...">
          <button id="accountability-complete-${i}" class="ml-[1vw] py-[0.5rem] px-[1rem] bg-blue-500 text-white rounded hover:bg-blue-600 ${isCompleted ? 'disabled completed' : ''}">${isCompleted ? 'Completed' : 'Mark as Completed'}</button>`;
      }
      div.innerHTML = `
        <svg class="task-icon w-[5vw] h-[5vw] min-w-[20px] min-h-[20px] max-w-[30px] max-h-[30px] text-${severity === 'mild' ? 'green' : severity === 'moderate' ? 'yellow' : 'red'}-500" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" fill="currentColor"/>
          <path d="M10 15l-3-3 1.5-1.5L10 12l5-5 1.5 1.5z" fill="white"/>
        </svg>
        <p class="text-gray-700 text-[0.9rem] sm:text-[1rem] dark:text-gray-300">${task.text}</p>
        ${actionHtml}`;
      tasksEl.appendChild(div);
      if (task.action === 'notepad' && notepadStates[taskId]) {
        const notepadList = document.getElementById(`notepadList${i}`);
        notepadStates[taskId].forEach(value => {
          const div = document.createElement('div');
          div.className = 'flex items-center space-x-[1vw] mt-[0.5vh]';
          div.innerHTML = `<span class="text-[0.9rem]">${value}</span>`;
          notepadList.appendChild(div);
        });
      }

      // Attach event listeners dynamically using addInteractionListener
      if (task.action === 'meditation') {
        const startBtn = document.getElementById(`meditation-start-${i}`);
        const stopBtn = document.getElementById(`meditation-stop-${i}`);
        if (startBtn && !isCompleted) addInteractionListener(startBtn, () => startMeditation(i));
        if (stopBtn) addInteractionListener(stopBtn, () => stopMeditation(i));
      } else if (task.action === 'pomodoro') {
        const startBtn = document.getElementById(`pomodoro-start-${i}`);
        const stopBtn = document.getElementById(`pomodoro-stop-${i}`);
        if (startBtn && !isCompleted) addInteractionListener(startBtn, () => startPomodoro(i));
        if (stopBtn) addInteractionListener(stopBtn, () => stopPomodoro(i));
      } else if (task.action === 'notepad') {
        const saveBtn = document.getElementById(`notepad-save-${i}`);
        const clearBtn = document.getElementById(`notepad-clear-${i}`);
        if (saveBtn && !isCompleted) addInteractionListener(saveBtn, () => saveNotepad(i));
        if (clearBtn) addInteractionListener(clearBtn, () => clearNotepad(i));
      } else if (task.action === 'workspace') {
        const completeBtn = document.getElementById(`workspace-complete-${i}`);
        if (completeBtn && !isCompleted) addInteractionListener(completeBtn, () => completeWorkspace(i));
      } else if (task.action === 'checklist') {
        const addBtn = document.getElementById(`checklist-add-${i}`);
        if (addBtn && !isCompleted) addInteractionListener(addBtn, () => addChecklistItem(i));
      } else if (task.action === 'focusBlock') {
        const startBtn = document.getElementById(`focusBlock-start-${i}`);
        const stopBtn = document.getElementById(`focusBlock-stop-${i}`);
        if (startBtn && !isCompleted) addInteractionListener(startBtn, () => startFocusBlock(i));
        if (stopBtn) addInteractionListener(stopBtn, () => stopFocusBlock(i));
      } else if (task.action === 'microTask') {
        const startBtn = document.getElementById(`microTask-start-${i}`);
        const completeBtn = document.getElementById(`microTask-complete-${i}`);
        const stopBtn = document.getElementById(`microTask-stop-${i}`);
        if (startBtn && !isCompleted) addInteractionListener(startBtn, () => startMicroTask(i));
        if (completeBtn) addInteractionListener(completeBtn, () => completeMicroTask(i));
        if (stopBtn) addInteractionListener(stopBtn, () => stopMicroTask(i));
      } else if (task.action === 'workStretch') {
        const startBtn = document.getElementById(`workStretch-start-${i}`);
        const stopBtn = document.getElementById(`workStretch-stop-${i}`);
        if (startBtn && !isCompleted) addInteractionListener(startBtn, () => startWorkStretch(i));
        if (stopBtn) addInteractionListener(stopBtn, () => stopWorkStretch(i));
      } else if (task.action === 'accountability') {
        const completeBtn = document.getElementById(`accountability-complete-${i}`);
        if (completeBtn && !isCompleted) addInteractionListener(completeBtn, () => completeAccountability(i));
      }
    });
    document.getElementById('result-screen').classList.remove('hidden');
    document.getElementById('result-screen').classList.add('fade-in');
    checkAllTasksCompleted();
    console.log("Result screen displayed, tasks:", quizState.tasks);
  }

  function stopAllTimers() {
    clearInterval(timerInterval);
    document.querySelectorAll('[id^="meditationTimer"],[id^="pomodoroTimer"],[id^="focusBlockTimer"],[id^="microTaskTimer"],[id^="workStretchTimer"]').forEach(el => el.classList.add('hidden'));
    currentActiveTask = null;
    enableTaskButtons();
  }

  function startMeditation(index) {
    const taskId = `meditation${index}`;
    if (currentActiveTask !== null || completedTasks.includes(taskId)) return;
    currentActiveTask = taskId;
    disableTaskButtons(index);
    const timerDiv = document.getElementById(`meditationTimer${index}`);
    const display = document.getElementById(`meditationDisplay${index}`);
    const button = document.getElementById(`meditation-start-${index}`);
    timerDiv.classList.remove('hidden');
    startTimer(300, display, () => {
      triggerPartyPopper(timerDiv);
      updateXP(xpPerTask);
      markTaskCompleted(taskId, button);
      timerDiv.classList.add('hidden');
      currentActiveTask = null;
      enableTaskButtons();
    });
    console.log("Meditation started, task:", taskId);
  }

  function stopMeditation(index) {
    clearInterval(timerInterval);
    document.getElementById(`meditationTimer${index}`).classList.add('hidden');
    currentActiveTask = null;
    enableTaskButtons();
    console.log("Meditation stopped, index:", index);
  }

  function startPomodoro(index) {
    const taskId = `pomodoro${index}`;
    if (currentActiveTask !== null || completedTasks.includes(taskId)) return;
    currentActiveTask = taskId;
    disableTaskButtons(index);
    const timerDiv = document.getElementById(`pomodoroTimer${index}`);
    const display = document.getElementById(`pomodoroDisplay${index}`);
    const button = document.getElementById(`pomodoro-start-${index}`);
    timerDiv.classList.remove('hidden');
    pomodoroPhase = 'focus';
    pomodoroCycles = 0;
    runPomodoro(index, display, timerDiv, button);
    console.log("Pomodoro started, task:", taskId);
  }

  function runPomodoro(index, display, timerDiv, button) {
    const duration = pomodoroPhase === 'focus' ? 1500 : 300;
    startTimer(duration, display, () => {
      if (pomodoroPhase === 'focus') {
        pomodoroPhase = 'break';
        runPomodoro(index, display, timerDiv, button);
      } else {
        pomodoroCycles++;
        if (pomodoroCycles < 4) {
          pomodoroPhase = 'focus';
          runPomodoro(index, display, timerDiv, button);
        } else {
          triggerPartyPopper(timerDiv);
          updateXP(xpPerTask);
          markTaskCompleted(`pomodoro${index}`, button);
          timerDiv.classList.add('hidden');
          currentActiveTask = null;
          enableTaskButtons();
        }
      }
    }, () => {
      display.textContent = `${pomodoroPhase === 'focus' ? 'Focus' : 'Break'}: ${display.textContent}`;
    });
  }

  function stopPomodoro(index) {
    clearInterval(timerInterval);
    document.getElementById(`pomodoroTimer${index}`).classList.add('hidden');
    currentActiveTask = null;
    enableTaskButtons();
    console.log("Pomodoro stopped, index:", index);
  }

  function saveNotepad(index) {
    const taskId = `notepad${index}`;
    if (currentActiveTask !== null && currentActiveTask !== taskId || completedTasks.includes(taskId)) return;
    currentActiveTask = taskId;
    disableTaskButtons(index);
    const textarea = document.getElementById(`notepad${index}`);
    const notepadList = document.getElementById(`notepadList${index}`);
    const button = document.getElementById(`notepad-save-${index}`);
    const value = textarea.value.trim();
    if (value && (!notepadStates[taskId] || !notepadStates[taskId].includes(value))) {
      notepadStates[taskId] = notepadStates[taskId] || [];
      notepadStates[taskId].push(value);
      saveUserData();
      const div = document.createElement('div');
      div.className = 'flex items-center space-x-[1vw] mt-[0.5vh]';
      div.innerHTML = `<span class="text-[0.9rem]">${value}</span>`;
      notepadList.appendChild(div);
      triggerPartyPopper(notepadList);
      updateXP(xpPerTask);
      markTaskCompleted(taskId, button);
      textarea.value = '';
    }
    currentActiveTask = null;
    enableTaskButtons();
    console.log("Notepad saved, task:", taskId);
  }

  function clearNotepad(index) {
    const taskId = `notepad${index}`;
    if (currentActiveTask !== null && currentActiveTask !== taskId) return;
    currentActiveTask = taskId;
    disableTaskButtons(index);
    document.getElementById(`notepad${index}`).value = '';
    document.getElementById(`notepadList${index}`).innerHTML = '';
    notepadStates[taskId] = [];
    saveUserData();
    currentActiveTask = null;
    enableTaskButtons();
    console.log("Notepad cleared, task:", taskId);
  }

  function completeWorkspace(index) {
    const taskId = `workspace${index}`;
    if (completedTasks.includes(taskId)) return;
    const button = document.getElementById(`workspace-complete-${index}`);
    triggerPartyPopper(button);
    updateXP(xpPerTask);
    markTaskCompleted(taskId, button);
    console.log("Workspace completed, task:", taskId);
  }

  function addChecklistItem(index) {
    const taskId = `checklist${index}`;
    if (currentActiveTask !== null && currentActiveTask !== taskId || completedTasks.includes(taskId)) return;
    currentActiveTask = taskId;
    disableTaskButtons(index);
    const input = document.getElementById(`checklistInput${index}`);
    const checklist = document.getElementById(`checklist${index}`);
    const button = document.getElementById(`checklist-add-${index}`);
    if (input.value.trim()) {
      const div = document.createElement('div');
      div.className = 'flex items-center space-x-[1vw] mt-[0.5vh]';
      div.innerHTML = `
        <input type="checkbox" class="w-[1.5rem] h-[1.5rem]">
        <span class="text-[0.9rem]">${input.value}</span>`;
      const checkbox = div.querySelector('input');
      addInteractionListener(checkbox, () => {
        if (checkbox.checked) {
          triggerPartyPopper(checkbox);
          updateXP(xpPerTask);
          markTaskCompleted(`checklist${index}`, button);
          div.classList.add('line-through', 'text-gray-500', 'dark:text-gray-400');
        }
      });
      checklist.appendChild(div);
      input.value = '';
    }
    currentActiveTask = null;
    enableTaskButtons();
    console.log("Checklist item added, task:", taskId);
  }

  function startFocusBlock(index) {
    const taskId = `focusBlock${index}`;
    if (currentActiveTask !== null || completedTasks.includes(taskId)) return;
    currentActiveTask = taskId;
    disableTaskButtons(index);
    const timerDiv = document.getElementById(`focusBlockTimer${index}`);
    const display = document.getElementById(`focusBlockDisplay${index}`);
    const button = document.getElementById(`focusBlock-start-${index}`);
    timerDiv.classList.remove('hidden');
    startTimer(2700, display, () => {
      triggerPartyPopper(timerDiv);
      updateXP(xpPerTask);
      markTaskCompleted(taskId, button);
      timerDiv.classList.add('hidden');
      currentActiveTask = null;
      enableTaskButtons();
    });
    console.log("Focus block started, task:", taskId);
  }

  function stopFocusBlock(index) {
    clearInterval(timerInterval);
    document.getElementById(`focusBlockTimer${index}`).classList.add('hidden');
    currentActiveTask = null;
    enableTaskButtons();
    console.log("Focus block stopped, index:", index);
  }

  function startMicroTask(index) {
    const taskId = `microTask${index}`;
    if (currentActiveTask !== null || completedTasks.includes(taskId)) return;
    currentActiveTask = taskId;
    disableTaskButtons(index);
    const timerDiv = document.getElementById(`microTaskTimer${index}`);
    const display = document.getElementById(`microTaskDisplay${index}`);
    timerDiv.classList.remove('hidden');
    startTimer(300, display, () => {
      timerDiv.classList.add('hidden');
      currentActiveTask = null;
      enableTaskButtons();
    });
    console.log("Micro-task started, task:", taskId);
  }

  function completeMicroTask(index) {
    const taskId = `microTask${index}`;
    if (currentActiveTask !== taskId) return;
    if (timerInterval) {
      clearInterval(timerInterval);
      const timerDiv = document.getElementById(`microTaskTimer${index}`);
      const button = document.getElementById(`microTask-start-${index}`);
      triggerPartyPopper(timerDiv);
      updateXP(xpPerTask);
      markTaskCompleted(taskId, button);
      timerDiv.classList.add('hidden');
      currentActiveTask = null;
      enableTaskButtons();
    }
    console.log("Micro-task completed, task:", taskId);
  }

  function stopMicroTask(index) {
    const taskId = `microTask${index}`;
    if (currentActiveTask !== taskId) return;
    clearInterval(timerInterval);
    document.getElementById(`microTaskTimer${index}`).classList.add('hidden');
    currentActiveTask = null;
    enableTaskButtons();
    console.log("Micro-task stopped, index:", index);
  }

  function startWorkStretch(index) {
    const taskId = `workStretch${index}`;
    if (currentActiveTask !== null || completedTasks.includes(taskId)) return;
    currentActiveTask = taskId;
    disableTaskButtons(index);
    const timerDiv = document.getElementById(`workStretchTimer${index}`);
    const display = document.getElementById(`workStretchDisplay${index}`);
    const button = document.getElementById(`workStretch-start-${index}`);
    timerDiv.classList.remove('hidden');
    pomodoroPhase = 'work';
    runWorkStretch(index, display, timerDiv, button);
    console.log("Work-stretch started, task:", taskId);
  }

  function runWorkStretch(index, display, timerDiv, button) {
    const duration = pomodoroPhase === 'work' ? 900 : 300;
    startTimer(duration, display, () => {
      if (pomodoroPhase === 'work') {
        triggerPartyPopper(timerDiv);
        updateXP(xpPerTask);
        markTaskCompleted(`workStretch${index}`, button);
        pomodoroPhase = 'stretch';
        runWorkStretch(index, display, timerDiv, button);
      } else {
        pomodoroPhase = 'work';
        runWorkStretch(index, display, timerDiv, button);
      }
    }, () => {
      display.textContent = `${pomodoroPhase === 'work' ? 'Work' : 'Stretch'}: ${display.textContent}`;
    });
  }

  function stopWorkStretch(index) {
    const taskId = `workStretch${index}`;
    if (currentActiveTask !== taskId) return;
    clearInterval(timerInterval);
    document.getElementById(`workStretchTimer${index}`).classList.add('hidden');
    currentActiveTask = null;
    enableTaskButtons();
    console.log("Work-stretch stopped, index:", index);
  }

  function completeAccountability(index) {
    const taskId = `accountability${index}`;
    if (completedTasks.includes(taskId)) return;
    const input = document.getElementById(`accountability${index}`);
    const button = document.getElementById(`accountability-complete-${index}`);
    if (input.value.trim()) {
      triggerPartyPopper(button);
      updateXP(xpPerTask);
      markTaskCompleted(taskId, button);
    }
    console.log("Accountability completed, task:", taskId);
  }
</script>
