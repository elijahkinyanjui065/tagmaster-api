/* background.js — MESSAGE RELAY ONLY v6.0 */

console.log('[TagMaster] Background service worker loaded');

// Keep service worker alive
chrome.runtime.onInstalled.addListener(() => {
  console.log('[TagMaster] Extension installed');
});

// Relay messages from popup to content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  // Handle generate request from popup
  if (message.action === 'generate') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'generate' }, (response) => {
          sendResponse(response);
        });
      }
    });
    return true; // Keep channel open for async response
  }

  // Handle status check
  if (message.action === 'ping') {
    sendResponse({ status: 'alive' });
    return true;
  }
});

// Optional: Context menu for quick generate
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'generate-tags',
    title: 'Generate Zazzle Tags',
    contexts: ['page'],
    documentUrlPatterns: ['*://*.zazzle.com/*']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'generate-tags') {
    chrome.tabs.sendMessage(tab.id, { action: 'generate' });
  }
});
