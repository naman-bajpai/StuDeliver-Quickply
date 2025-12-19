import { onMessage } from './lib/messaging';
import { initAuth } from './lib/auth';

// Initialize background service worker
chrome.runtime.onInstalled.addListener(() => {
  console.log('JobFill extension installed');
  initAuth();
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  onMessage(message, sender, sendResponse);
  return true; // Keep channel open for async response
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, { action: 'toggleExtension' });
  }
});

