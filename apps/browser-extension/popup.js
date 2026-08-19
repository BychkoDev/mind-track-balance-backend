document.addEventListener('DOMContentLoaded', () => {
  const statsContainer = document.getElementById('stats');
  
  function renderStats(stats) {
    statsContainer.innerHTML = '';
    
    // Sort array by time descending
    const sorted = Object.entries(stats).sort((a, b) => b[1] - a[1]);
    
    if (sorted.length === 0) {
      statsContainer.innerHTML = '<div style="text-align: center; color: #94a3b8; margin-top: 20px;">No data yet. Keep browsing!</div>';
      return;
    }

    sorted.forEach(([domain, timeMs]) => {
      // Don't show domains with less than 5 seconds, or null
      if (domain === 'null' || timeMs < 5000) return;

      const minutes = Math.floor(timeMs / 60000);
      const seconds = Math.floor((timeMs % 60000) / 1000);
      let displayTime = '';
      if (minutes > 0) displayTime += `${minutes}m `;
      displayTime += `${seconds}s`;

      const row = document.createElement('div');
      row.className = 'stat-row';
      
      const domSpan = document.createElement('span');
      domSpan.className = 'domain';
      domSpan.textContent = domain;
      domSpan.title = domain; // tooltip

      const timeSpan = document.createElement('span');
      timeSpan.className = 'time';
      timeSpan.textContent = displayTime;

      row.appendChild(domSpan);
      row.appendChild(timeSpan);
      statsContainer.appendChild(row);
    });
    
    if (statsContainer.children.length === 0) {
      statsContainer.innerHTML = '<div style="text-align: center; color: #94a3b8; margin-top: 20px;">No significant data yet.</div>';
    }
  }

  // Fetch stats and render
  chrome.runtime.sendMessage({ action: 'getStats' }, (response) => {
    renderStats(response || {});
  });

  // Check current domain tracking status
  chrome.runtime.sendMessage({ action: 'getCurrentDomainInfo' }, (response) => {
    if (response && response.domain && response.domain !== 'null' && !response.isTracked) {
      document.getElementById('trackingBanner').style.display = 'block';
      document.getElementById('currentDomainName').textContent = response.domain;
      
      document.getElementById('trackDomainBtn').onclick = () => {
        const btn = document.getElementById('trackDomainBtn');
        btn.textContent = 'Adding...';
        chrome.runtime.sendMessage({ action: 'addTrackedDomain', domain: response.domain }, (res) => {
          if (res && res.status === 'ok') {
            document.getElementById('trackingBanner').style.display = 'none';
          } else {
            btn.textContent = 'Failed';
          }
        });
      };
    }
  });

  // Ask for user name
  chrome.runtime.sendMessage({ action: 'getUserName' }, (name) => {
    if (name) {
      document.getElementById('welcome-msg').textContent = `Welcome, ${name}!`;
    } else {
      document.getElementById('welcome-msg').textContent = `Welcome! (Not logged in)`;
    }
  });

  // Reset button logic
  document.getElementById('resetBtn').addEventListener('click', () => {
    chrome.storage.local.set({ domainStats: {} }, () => {
      renderStats({});
    });
  });

  // Sync button logic
  document.getElementById('syncBtn').addEventListener('click', () => {
    const btn = document.getElementById('syncBtn');
    btn.textContent = 'Syncing...';
    chrome.runtime.sendMessage({ action: 'syncNow' }, () => {
      // After sync, get stats again to refresh UI (should be empty if successful)
      chrome.runtime.sendMessage({ action: 'getStats' }, (response) => {
        renderStats(response || {});
        btn.textContent = 'Sync Now';
      });
    });
  });
});
