import { extractFields } from './lib/fieldExtract';
import { fillFields } from './lib/fill';

// Listen for messages from background or popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  // Handle ping for connection check
  if (message.action === 'ping') {
    sendResponse({ success: true, pong: true });
    return true;
  }

  switch (message.action) {
    case 'extractFields':
      const fields = extractFields();
      sendResponse({ success: true, fields });
      break;
    
    case 'fillFields':
      fillFields(message.data)
        .then(() => sendResponse({ success: true }))
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true; // Keep channel open for async response
    
    case 'toggleExtension':
      // Toggle extension UI or functionality
      console.log('Extension toggled');
      sendResponse({ success: true });
      break;
    
    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }
  
  return true; // Keep channel open for async response
});

// Initialize content script
console.log('JobFill content script loaded');

