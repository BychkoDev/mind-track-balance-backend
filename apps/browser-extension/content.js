// Implementation of the Figma Pause Mode Overlay in vanilla JS
function showPauseModeOverlay() {
  if (document.getElementById('mind-track-overlay-root')) return;

  const overlay = document.createElement('div');
  overlay.id = 'mind-track-overlay-root';
  
  overlay.innerHTML = `
    <div class="mt-backdrop"></div>
    <div class="mt-modal">
      <div class="mt-header">Take a mindful pause.</div>
      <div class="mt-subheader">Breathe for 5 seconds before you continue.</div>
      
      <div class="mt-timer-container">
        <div class="mt-timer-bg"></div>
        <svg class="mt-svg-ring">
          <defs>
            <linearGradient id="mt-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c4b5fd" />
              <stop offset="100%" stopColor="#93c5fd" />
            </linearGradient>
          </defs>
          <circle class="mt-circle-track" cx="80" cy="80" r="70"></circle>
          <circle class="mt-circle-progress" id="mt-progress-circle" cx="80" cy="80" r="70"></circle>
        </svg>
        <div class="mt-timer-text">
          <div class="mt-timer-num" id="mt-countdown-text">5</div>
          <div class="mt-timer-label" id="mt-countdown-label">seconds</div>
        </div>
      </div>

      <div class="mt-actions">
        <button id="mt-btn-cancel" class="mt-btn mt-btn-secondary">Leave website</button>
        <button id="mt-btn-continue" class="mt-btn mt-btn-primary">Continue</button>
      </div>
      <div class="mt-footer-note">Mindful moments help you regain balance.</div>
    </div>
  `;
  
  document.body.appendChild(overlay);

  const btnCancel = document.getElementById('mt-btn-cancel');
  const btnContinue = document.getElementById('mt-btn-continue');
  const countdownText = document.getElementById('mt-countdown-text');
  const countdownLabel = document.getElementById('mt-countdown-label');
  const progressCircle = document.getElementById('mt-progress-circle');
  
  const circumference = 2 * Math.PI * 70; // 440
  let secondsLeft = 5;

  btnCancel.addEventListener('click', () => {
    // Usually redirect or close tab. For MVP, we will redirect to google.
    window.location.href = 'https://google.com';
  });

  btnContinue.addEventListener('click', () => {
    if (secondsLeft <= 0) {
      overlay.remove();
      // Inform background script that user passed the pause screen to prevent looping.
      chrome.runtime.sendMessage({ action: 'pauseCompleted', domain: window.location.hostname });
    }
  });

  const interval = setInterval(() => {
    secondsLeft--;
    
    if (secondsLeft > 0) {
      countdownText.textContent = secondsLeft;
      countdownLabel.textContent = secondsLeft === 1 ? 'second' : 'seconds';
      
      const progress = ((5 - secondsLeft) / 5);
      progressCircle.style.strokeDashoffset = circumference * progress;
    } else {
      clearInterval(interval);
      countdownText.innerHTML = '✨';
      countdownLabel.textContent = '';
      progressCircle.style.strokeDashoffset = circumference;
      
      btnContinue.classList.add('active');
    }
  }, 1000);
}

// Listen to messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'showWarning') {
    showPauseModeOverlay();
    sendResponse({ received: true });
  } else if (request.action === 'showHardBlock') {
    showHardBlockOverlay(request.limitSec, request.totalSec);
    sendResponse({ received: true });
  } else if (request.action === 'checkMediaPlaying') {
    const mediaElements = Array.from(document.querySelectorAll('video, audio'));
    // Check if any media element is currently playing (not paused and not ended)
    const isPlaying = mediaElements.some(media => !media.paused && !media.ended && media.currentTime > 0);
    sendResponse({ isPlaying });
  }
});

function showHardBlockOverlay(limitSec, totalSec) {
  if (document.getElementById('mt-hard-block-root')) return;

  // Remove soft pause if it exists
  const existingPause = document.getElementById('mind-track-overlay-root');
  if (existingPause) existingPause.remove();

  const overlay = document.createElement('div');
  overlay.id = 'mt-hard-block-root';
  
  const formattedLimit = Math.floor(limitSec / 60) + ' хв';
  
  // Pick random challenge (0: Typing, 1: Math, 2: Delay)
  const challengeType = Math.floor(Math.random() * 3);
  
  let challengeHtml = '';
  if (challengeType === 0) {
    const phrases = [
      "Я свідомо обираю витратити ще 15 хвилин на цьому сайті.",
      "Мій час цінний, але я вирішив залишитися тут ще трохи.",
      "Я ігнорую свій денний ліміт і розумію наслідки."
    ];
    const targetPhrase = phrases[Math.floor(Math.random() * phrases.length)];
    challengeHtml = `
      <div class="mt-challenge-box" style="margin-top: 20px; text-align: left;">
        <p style="font-size: 14px; color: #94a3b8; margin-bottom: 8px;">Щоб отримати ще 15 хвилин, надрукуйте фразу без помилок:</p>
        <div style="background: #1e293b; padding: 12px; border-radius: 8px; font-style: italic; color: #e2e8f0; margin-bottom: 12px; user-select: none;">
          <span id="mt-target-phrase">${targetPhrase}</span>
        </div>
        <textarea id="mt-challenge-input" placeholder="Почніть вводити текст..." style="width: 100%; height: 60px; background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 10px; color: white; resize: none;"></textarea>
      </div>
    `;
  } else if (challengeType === 1) {
    const a = Math.floor(Math.random() * 10) + 5; // 5-14
    const b = Math.floor(Math.random() * 5) + 3;  // 3-7
    const c = Math.floor(Math.random() * 20) + 1; // 1-20
    const answer = (a * b) + c;
    challengeHtml = `
      <div class="mt-challenge-box" style="margin-top: 20px; text-align: left;">
        <p style="font-size: 14px; color: #94a3b8; margin-bottom: 8px;">Розв'яжіть задачу, щоб отримати 15 хвилин:</p>
        <div style="background: #1e293b; padding: 12px; border-radius: 8px; font-size: 20px; text-align: center; color: #e2e8f0; margin-bottom: 12px; font-weight: bold;">
          ${a} × ${b} + ${c} = ?
        </div>
        <input type="number" id="mt-challenge-math" placeholder="Ваша відповідь" style="width: 100%; background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 10px; color: white; font-size: 16px; text-align: center;" />
        <input type="hidden" id="mt-math-answer" value="${answer}" />
      </div>
    `;
  } else {
    challengeHtml = `
      <div class="mt-challenge-box" style="margin-top: 20px; text-align: center;">
        <p style="font-size: 14px; color: #94a3b8; margin-bottom: 16px;">Доведіть свою усвідомленість. Зачекайте 30 секунд не перемикаючи вкладку.</p>
        <button id="mt-start-delay" style="background: #334155; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold;">Почати очікування</button>
        <div id="mt-delay-timer" style="font-size: 32px; font-weight: bold; color: #e2e8f0; margin-top: 10px; display: none;">30</div>
      </div>
    `;
  }

  overlay.innerHTML = `
    <div style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(10px); z-index: 2147483647; display: flex; align-items: center; justify-content: center; font-family: system-ui, sans-serif;">
      <div style="background: #020617; border: 1px solid #1e293b; border-radius: 24px; padding: 40px; max-width: 400px; width: 90%; text-align: center; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
        <div style="width: 60px; height: 60px; background: rgba(239, 68, 68, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        </div>
        <h2 style="color: white; font-size: 24px; font-weight: bold; margin: 0 0 10px;">Час вичерпано</h2>
        <p style="color: #94a3b8; font-size: 15px; line-height: 1.5; margin: 0 0 24px;">Ви досягли свого денного ліміту (${formattedLimit}) для цього сайту. Зробіть перерву.</p>
        
        <button id="mt-hb-leave" style="width: 100%; background: #3b82f6; hover:bg: #2563eb; color: white; border: none; padding: 14px; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer; transition: 0.2s;">Покинути сайт</button>
        
        <div id="mt-expand-link" style="margin-top: 20px; font-size: 13px; color: #64748b; text-decoration: underline; cursor: pointer;">Мені конче треба ще 15 хвилин</div>
        
        <div id="mt-challenge-container" style="display: none; border-top: 1px solid #1e293b; margin-top: 20px; padding-top: 10px;">
          ${challengeHtml}
          <button id="mt-hb-unlock" style="width: 100%; background: #10b981; color: white; border: none; padding: 14px; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer; margin-top: 20px; opacity: 0.5; pointer-events: none; transition: 0.2s;">Розблокувати</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);

  document.getElementById('mt-hb-leave').addEventListener('click', () => {
    window.location.href = 'https://google.com';
  });

  const expandLink = document.getElementById('mt-expand-link');
  const challengeContainer = document.getElementById('mt-challenge-container');
  const unlockBtn = document.getElementById('mt-hb-unlock');

  expandLink.addEventListener('click', () => {
    expandLink.style.display = 'none';
    challengeContainer.style.display = 'block';
  });

  // Handle Challenge Logic
  if (challengeType === 0) {
    const input = document.getElementById('mt-challenge-input');
    const targetPhrase = document.getElementById('mt-target-phrase').innerText;
    input.addEventListener('input', () => {
      if (input.value === targetPhrase) {
        unlockBtn.style.opacity = '1';
        unlockBtn.style.pointerEvents = 'auto';
        input.style.borderColor = '#10b981';
      } else {
        unlockBtn.style.opacity = '0.5';
        unlockBtn.style.pointerEvents = 'none';
      }
    });
  } else if (challengeType === 1) {
    const input = document.getElementById('mt-challenge-math');
    const answer = document.getElementById('mt-math-answer').value;
    input.addEventListener('input', () => {
      if (input.value === answer) {
        unlockBtn.style.opacity = '1';
        unlockBtn.style.pointerEvents = 'auto';
        input.style.borderColor = '#10b981';
      } else {
        unlockBtn.style.opacity = '0.5';
        unlockBtn.style.pointerEvents = 'none';
      }
    });
  } else if (challengeType === 2) {
    const startBtn = document.getElementById('mt-start-delay');
    const timerDisplay = document.getElementById('mt-delay-timer');
    let delayTimer = null;
    let timeLeft = 30;

    const resetTimer = () => {
      clearInterval(delayTimer);
      delayTimer = null;
      timeLeft = 30;
      timerDisplay.style.display = 'none';
      startBtn.style.display = 'inline-block';
      startBtn.innerText = 'Спробувати знову';
      startBtn.style.background = '#ef4444';
    };

    window.addEventListener('blur', () => {
      if (delayTimer) resetTimer();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && delayTimer) resetTimer();
    });

    startBtn.addEventListener('click', () => {
      startBtn.style.display = 'none';
      timerDisplay.style.display = 'block';
      timerDisplay.innerText = timeLeft;
      
      delayTimer = setInterval(() => {
        timeLeft--;
        timerDisplay.innerText = timeLeft;
        if (timeLeft <= 0) {
          clearInterval(delayTimer);
          timerDisplay.style.color = '#10b981';
          timerDisplay.innerText = 'Готово!';
          unlockBtn.style.opacity = '1';
          unlockBtn.style.pointerEvents = 'auto';
        }
      }, 1000);
    });
  }

  unlockBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'extendLimit', domain: window.location.hostname }, () => {
      overlay.remove();
    });
  });
}
