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
  }
});
