export interface Message {
  action: string;
  data?: any;
}

export function sendMessage(message: Message): Promise<any> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

export function sendMessageToTab(tabId: number, message: Message): Promise<any> {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

import { storage } from './storage';

export async function onMessage(
  message: Message,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
) {
  try {
    switch (message.action) {
      case 'getUserData':
        const userData = await storage.getUserData();
        sendResponse({ success: true, data: userData });
        break;

      case 'setUserData':
        await storage.setUserData(message.data);
        sendResponse({ success: true });
        break;

      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
  } catch (error: any) {
    sendResponse({ success: false, error: error.message });
  }
}

