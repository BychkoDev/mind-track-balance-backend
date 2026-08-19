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

// Initialize on startup/reload
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs.length > 0) {
    activeTabId = tabs[0].id;
    currentDomain = getDomain(tabs[0].url);
    activeStartTime = Date.now();
    setTimeout(() => updateBadge(currentDomain), 1000); // Wait for rules to load
  }
});

// Log time for the current domain
async function saveCurrentDomainTime() {
  if (currentDomain && currentDomain !== 'null' && activeStartTime) {
    if (!isTracked(currentDomain)) return;

    const elapsed = Date.now() - activeStartTime;
    if (elapsed > 1000) {
      const result = await chrome.storage.local.get(['domainStats']);
      const stats = result.domainStats || {};
      stats[currentDomain] = (stats[currentDomain] || 0) + elapsed;
      await chrome.storage.local.set({ domainStats: stats });
    }
  }
}

const GLOBAL_DOMAINS = [
  'facebook.com', 'www.facebook.com',
  'instagram.com', 'www.instagram.com',
  'tiktok.com', 'www.tiktok.com',
  'x.com', 'twitter.com', 'youtube.com', 'www.youtube.com',
  'reddit.com', 'www.reddit.com',
  'netflix.com', 'www.netflix.com',
  'twitch.tv', 'www.twitch.tv',
  'pinterest.com', 'www.pinterest.com'
];

let customRules = {}; // From backend { "domain.com": { isBlocked: true, isTracked: true } }

function isTracked(domain) {
  if (!domain) return false;
  if (customRules[domain]) return customRules[domain].isTracked;
  return GLOBAL_DOMAINS.includes(domain);
}

function isBlocked(domain) {
  if (!domain) return false;
  if (customRules[domain]) return customRules[domain].isBlocked;
  return GLOBAL_DOMAINS.includes(domain);
}

let completedPauses = {};
let extendedLimits = {}; // { "domain.com": timestamp_when_extension_expires }

async function checkNeedPause(tabId, domain, retryCount = 0) {
  if (!domain || domain === 'null') return;

  // 1. Hard Limits Check
  if (customRules[domain] && customRules[domain].dailyLimitSec) {
    const dailyLimit = customRules[domain].dailyLimitSec;
    const serverTodaySec = customRules[domain].todaySeconds || 0;
    
    // Calculate local unsynced time
    const result = await chrome.storage.local.get(['domainStats']);
    const stats = result.domainStats || {};
    const localSec = Math.floor((stats[domain] || 0) / 1000);
    
    // Add time from the current active session
    let currentSessionSec = 0;
    if (currentDomain === domain && activeStartTime) {
      currentSessionSec = Math.floor((Date.now() - activeStartTime) / 1000);
    }

    const totalTodaySec = serverTodaySec + localSec + currentSessionSec;

    if (totalTodaySec >= dailyLimit) {
      // Check if user has an active extension
      if (!extendedLimits[domain] || Date.now() > extendedLimits[domain]) {
        try {
          chrome.tabs.sendMessage(tabId, { action: 'showHardBlock', domain, limitSec: dailyLimit, totalSec: totalTodaySec }, (response) => {
            if (chrome.runtime.lastError) {
              if (retryCount < 3) {
                setTimeout(() => checkNeedPause(tabId, domain, retryCount + 1), 1000);
              } else {
                // The content script is dead (e.g. extension was updated, or user tampered with it).
                // Force reload the tab to reinject the script and enforce the block.
                chrome.tabs.reload(tabId);
              }
            }
          });
        } catch(e) {}
        return; // Stop checking soft pauses if hard blocked
      }
    }
  }

  // 2. Soft Pause Check
  if (isBlocked(domain) && !completedPauses[domain]) {
    // Suppress soft pause if we are in an active extended limit
    if (extendedLimits[domain] && Date.now() < extendedLimits[domain]) {
      return; 
    }

    try {
      chrome.tabs.sendMessage(tabId, { action: 'showWarning' }, (response) => {
        if (chrome.runtime.lastError && retryCount < 3) {
          setTimeout(() => checkNeedPause(tabId, domain, retryCount + 1), 1000);
        }
      });
    } catch(e) {}
  }
}

// Run a continuous limit checker
setInterval(() => {
  if (currentDomain && activeTabId && isTracked(currentDomain)) {
    checkNeedPause(activeTabId, currentDomain);
  }
}, 10000); // Check every 10 seconds while active

function updateBadge(domain) {
  if (domain && domain !== 'null') {
    if (!isTracked(domain)) {
      chrome.action.setBadgeText({ text: '!' });
      chrome.action.setBadgeBackgroundColor({ color: '#f59e0b' });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  await saveCurrentDomainTime();
  activeTabId = activeInfo.tabId;
  const tab = await chrome.tabs.get(activeInfo.tabId);
  currentDomain = getDomain(tab.url);
  activeStartTime = Date.now();
  
  updateBadge(currentDomain);
  checkNeedPause(activeTabId, currentDomain);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (tab.active && changeInfo.url) {
    await saveCurrentDomainTime();
    currentDomain = getDomain(changeInfo.url);
    activeStartTime = Date.now();
    
    updateBadge(currentDomain);
    checkNeedPause(tabId, currentDomain);
  }
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    await saveCurrentDomainTime();
    currentDomain = null;
    updateBadge(null);
  } else {
    const [tab] = await chrome.tabs.query({ active: true, windowId: windowId });
    if (tab) {
      activeTabId = tab.id;
      currentDomain = getDomain(tab.url);
      activeStartTime = Date.now();
      
      updateBadge(currentDomain);
      checkNeedPause(activeTabId, currentDomain);
    }
  }
});

let mediaCheckInterval = null;

chrome.idle.setDetectionInterval(60);
chrome.idle.onStateChanged.addListener(async (newState) => {
  if (newState === 'idle' || newState === 'locked') {
    if (newState === 'idle' && activeTabId) {
      // Check if media is playing before stopping
      try {
        chrome.tabs.sendMessage(activeTabId, { action: 'checkMediaPlaying' }, async (response) => {
          if (chrome.runtime.lastError || !response || !response.isPlaying) {
            // No media playing -> stop tracking
            await saveCurrentDomainTime();
            currentDomain = null;
            completedPauses = {};
          } else {
            // Media IS playing! We ignore the idle state for now,
            // but we must start polling to see if the video ends while still idle.
            console.log("Ignored idle state because media is playing on " + currentDomain);
            if (mediaCheckInterval) clearInterval(mediaCheckInterval);
            
            mediaCheckInterval = setInterval(() => {
              chrome.tabs.sendMessage(activeTabId, { action: 'checkMediaPlaying' }, async (res) => {
                if (chrome.runtime.lastError || !res || !res.isPlaying) {
                  // Video stopped playing while user is still away
                  clearInterval(mediaCheckInterval);
                  mediaCheckInterval = null;
                  await saveCurrentDomainTime();
                  currentDomain = null;
                  completedPauses = {};
                } else {
                  // Still playing, update start time so we don't accumulate one massive chunk
                  // and we periodically save the ongoing session.
                  await saveCurrentDomainTime();
                  activeStartTime = Date.now();
                }
              });
            }, 30000); // Check every 30 seconds
          }
        });
      } catch (e) {
        await saveCurrentDomainTime();
        currentDomain = null;
        completedPauses = {}; 
      }
    } else {
      // If locked or no active tab, definitely stop.
      if (mediaCheckInterval) {
        clearInterval(mediaCheckInterval);
        mediaCheckInterval = null;
      }
      await saveCurrentDomainTime();
      currentDomain = null;
      completedPauses = {}; 
    }
  } else if (newState === 'active') {
    if (mediaCheckInterval) {
      clearInterval(mediaCheckInterval);
      mediaCheckInterval = null;
    }
    activeStartTime = Date.now();
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        currentDomain = getDomain(tabs[0].url);
        checkNeedPause(tabs[0].id, currentDomain);
      }
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getStats') {
    saveCurrentDomainTime().then(() => {
      activeStartTime = Date.now();
      chrome.storage.local.get(['domainStats'], (result) => {
        sendResponse(result.domainStats || {});
      });
    });
    return true;
  } else if (request.action === 'getUserName') {
    if (!authToken) {
      sendResponse(null);
      return true;
    }
    const API_USER_URL = 'http://localhost:4091/api/v1/user';
    fetch(`${API_USER_URL}/me`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
    .then(async res => {
      if (res.ok) {
        const data = await res.json();
        sendResponse(data.fullName || data.login || 'User');
      } else {
        const errText = await res.text();
        const tLen = authToken ? authToken.length : 0;
        const tPrefix = authToken ? authToken.substring(0, 10) : 'none';
        sendResponse(`Error: ${res.status} (token len: ${tLen}, prefix: ${tPrefix})`);
      }
    })
    .catch(err => sendResponse(`Fetch error: ${err.message}`));
    return true;
  } else if (request.action === 'pauseCompleted') {
    if (request.domain) {
      completedPauses[request.domain] = true;
    }
  } else if (request.action === 'syncNow') {
    syncStatsToBackend().then(() => {
      sendResponse({ status: 'ok' });
    });
    return true;
  } else if (request.action === 'getCurrentDomainInfo') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        const domain = getDomain(tabs[0].url);
        sendResponse({ domain, isTracked: isTracked(domain) });
      } else {
        sendResponse({ domain: null, isTracked: false });
      }
    });
    return true;
  } else if (request.action === 'extendLimit') {
    if (request.domain) {
      // Grant 15 minutes (900 seconds) of extended time
      extendedLimits[request.domain] = Date.now() + 15 * 60 * 1000;
      sendResponse({ status: 'ok' });
    }
  } else if (request.action === 'addTrackedDomain') {
    if (request.domain && authToken) {
      fetch(`${API_ATTENTION_URL}/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ domain: request.domain, isTracked: true, isBlocked: false })
      })
      .then(res => {
        if (res.ok) {
          syncTokenAndConfig().then(() => sendResponse({ status: 'ok' }));
        } else {
          sendResponse({ status: 'error' });
        }
      })
      .catch(() => sendResponse({ status: 'error' }));
      return true;
    } else {
      sendResponse({ status: 'error', reason: 'No token or domain' });
    }
  }
});

const WEB_APP_URL = 'http://localhost:3000';
const API_ATTENTION_URL = 'http://localhost:4094/api/v1/attention';
const API_AUTH_URL = 'http://localhost:4090/api/v1/auth';
let authToken = null;

async function syncTokenAndConfig() {
  try {
    let accessCookies = await chrome.cookies.getAll({ name: 'jwt_access_token' });
    let refreshCookies = await chrome.cookies.getAll({ name: 'jwt_refresh_token' });

    let accessCookie = accessCookies.length > 0 ? accessCookies[0] : null;
    let refreshCookie = refreshCookies.length > 0 ? refreshCookies[0] : null;

    const currentDomainCookie = accessCookie ? accessCookie.domain : 'localhost';
    const currentUrl = `http://${currentDomainCookie}:3000`;

    if ((!accessCookie || !accessCookie.value) && refreshCookie && refreshCookie.value) {
      const refreshRes = await fetch(`${API_AUTH_URL}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refreshCookie.value })
      });
      
      if (refreshRes.ok) {
        const tokens = await refreshRes.json();
        await chrome.cookies.set({ url: currentUrl, name: 'jwt_access_token', value: tokens.accessToken, httpOnly: true, path: '/' });
        await chrome.cookies.set({ url: currentUrl, name: 'jwt_refresh_token', value: tokens.refreshToken, httpOnly: true, path: '/' });
        accessCookie = { value: tokens.accessToken };
      }
    }

    if (accessCookie && accessCookie.value) {
      authToken = accessCookie.value;
      
      await syncStatsToBackend();

      const response = await fetch(`${API_ATTENTION_URL}/config`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const rulesMap = {};
        data.forEach(rule => {
          rulesMap[rule.domain] = rule;
        });
        customRules = rulesMap;
        updateBadge(currentDomain);
      }
    } else {
      authToken = null;
      customRules = {};
      updateBadge(currentDomain);
    }
  } catch (err) {
    console.error('Error syncing config/stats:', err);
  }
}

async function syncStatsToBackend() {
  if (!authToken) return;
  
  await saveCurrentDomainTime();
  activeStartTime = Date.now();

  const result = await chrome.storage.local.get(['domainStats']);
  const stats = result.domainStats || {};
  const domains = Object.keys(stats);
  if (domains.length === 0) return;

  const today = new Date().toISOString().split('T')[0];
  const records = domains.map(domain => ({
    domain,
    durationSec: Math.floor(stats[domain] / 1000),
    date: today
  })).filter(r => r.durationSec > 0 && r.domain !== 'null' && r.domain !== null);

  if (records.length === 0) return;

  try {
    const response = await fetch(`${API_ATTENTION_URL}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ records })
    });

    if (response.ok) {
      // Clear only synced amounts to prevent race conditions losing data
      const res = await chrome.storage.local.get(['domainStats']);
      const currentStats = res.domainStats || {};
      domains.forEach(domain => {
        if (currentStats[domain]) {
          currentStats[domain] -= stats[domain];
          if (currentStats[domain] <= 0) {
            delete currentStats[domain];
          }
        }
      });
      await chrome.storage.local.set({ domainStats: currentStats });
    }
  } catch (e) {
    console.error('Failed to sync stats to backend', e);
  }
}

syncTokenAndConfig();
setInterval(syncTokenAndConfig, 5 * 60 * 1000);

chrome.cookies.onChanged.addListener((changeInfo) => {
  if (changeInfo.cookie.name === 'jwt_access_token' && changeInfo.cookie.domain.includes('localhost')) {
    syncTokenAndConfig();
  }
});
