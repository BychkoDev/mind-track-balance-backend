let activeTabId = null;
let currentDomain = null;
let activeStartTime = Date.now();

// Extract domain from URL safely
function getDomain(url) {
  try {
    const urlObj = new URL(url);
    if (urlObj.protocol === 'chrome:' || urlObj.protocol === 'edge:') return null;
    return urlObj.hostname;
  } catch (e) {
    return null;
  }
}

// Log time for the current domain
function saveCurrentDomainTime() {
  if (currentDomain && currentDomain !== 'null' && activeStartTime) {
    const elapsed = Date.now() - activeStartTime;
    if (elapsed > 1000) {
      chrome.storage.local.get(['domainStats'], (result) => {
        const stats = result.domainStats || {};
        stats[currentDomain] = (stats[currentDomain] || 0) + elapsed;
        chrome.storage.local.set({ domainStats: stats });
      });
    }
  }
}

const RESTRICTED_DOMAINS = [
  'facebook.com', 'www.facebook.com',
  'instagram.com', 'www.instagram.com',
  'tiktok.com', 'www.tiktok.com',
  'x.com', 'twitter.com', 'youtube.com', 'www.youtube.com'
];

let completedPauses = {};

function checkNeedPause(tabId, domain, retryCount = 0) {
  if (domain && domain !== 'null' && RESTRICTED_DOMAINS.includes(domain) && !completedPauses[domain]) {
    try {
      chrome.tabs.sendMessage(tabId, { action: 'showWarning' }, (response) => {
        if (chrome.runtime.lastError && retryCount < 3) {
          // Content script might not be injected yet, retry in 1s
          setTimeout(() => checkNeedPause(tabId, domain, retryCount + 1), 1000);
        }
      });
    } catch(e) {}
  }
}

// Tab switched
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  saveCurrentDomainTime();
  activeTabId = activeInfo.tabId;
  const tab = await chrome.tabs.get(activeInfo.tabId);
  currentDomain = getDomain(tab.url);
  activeStartTime = Date.now();
  
  checkNeedPause(activeTabId, currentDomain);
});

// URL changed within the same tab
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.active && changeInfo.url) {
    saveCurrentDomainTime();
    currentDomain = getDomain(changeInfo.url);
    activeStartTime = Date.now();
    
    checkNeedPause(tabId, currentDomain);
  }
});

// Window focus changed (user minimized browser or switched to another window)
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    saveCurrentDomainTime();
    currentDomain = null;
  } else {
    // Gained focus
    const [tab] = await chrome.tabs.query({ active: true, windowId: windowId });
    if (tab) {
      activeTabId = tab.id;
      currentDomain = getDomain(tab.url);
      activeStartTime = Date.now();
      
      checkNeedPause(activeTabId, currentDomain);
    }
  }
});

// Intelligent Idle Detection (Walking away from PC)
chrome.idle.setDetectionInterval(60); // 60 seconds
chrome.idle.onStateChanged.addListener((newState) => {
  if (newState === 'idle' || newState === 'locked') {
    saveCurrentDomainTime();
    currentDomain = null; // Stop tracking
    // Reset pauses if they walked away for a while
    completedPauses = {}; 
  } else if (newState === 'active') {
    // User returned, resume tracking the active tab
    activeStartTime = Date.now();
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        currentDomain = getDomain(tabs[0].url);
        checkNeedPause(tabs[0].id, currentDomain);
      }
    });
  }
});

// Communication with popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getStats') {
    saveCurrentDomainTime();
    activeStartTime = Date.now(); // reset chunk
    
    chrome.storage.local.get(['domainStats'], (result) => {
      sendResponse(result.domainStats || {});
    });
    return true; // async
  } else if (request.action === 'pauseCompleted') {
    if (request.domain) {
      completedPauses[request.domain] = true;
    }
  }
});
