import { useState, useEffect } from 'react';
import { getCurrentUser, signOut } from '../lib/auth';
import { storage, UserData } from '../lib/storage';
import './popup.css';

export default function Popup() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<UserData>({});
  const [loading, setLoading] = useState(true);
  const [filling, setFilling] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      
      const data = await storage.getUserData();
      setUserData(data);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleFill() {
    setFilling(true);
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) {
        alert('Could not get active tab. Please try again.');
        return;
      }

      // Check if we can inject the content script
      try {
        await chrome.tabs.sendMessage(tab.id, { action: 'ping' });
      } catch (error: any) {
        // Content script might not be loaded, try to inject it
        if (error.message?.includes('Receiving end does not exist') || 
            error.message?.includes('Could not establish connection')) {
          // Inject the content script
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js'],
          });
          // Wait a bit for the script to initialize
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Now send the fill message
      const response = await sendMessageToTab(tab.id, {
        action: 'fillFields',
        data: userData,
      });
      
      if (response && (response as any).success) {
        alert('Fields filled successfully!');
      } else {
        alert('Failed to fill fields. Please check the console for details.');
      }
    } catch (error: any) {
      console.error('Error filling fields:', error);
      if (error.message?.includes('chrome://') || error.message?.includes('edge://')) {
        alert('Cannot fill fields on this page. Please navigate to a regular webpage.');
      } else {
        alert(`Error filling fields: ${error.message || 'Please try again.'}`);
      }
    } finally {
      setFilling(false);
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  async function handleSave() {
    try {
      await storage.setUserData(userData);
      alert('Data saved successfully!');
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Error saving data. Please try again.');
    }
  }

  if (loading) {
    return <div className="popup-container">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="popup-container">
        <h2>JobFill</h2>
        <p>Please sign in to use the extension.</p>
        <button onClick={() => chrome.runtime.openOptionsPage()}>
          Open Options
        </button>
      </div>
    );
  }

  return (
    <div className="popup-container">
      <div className="popup-header">
        <h2>JobFill</h2>
        <button className="sign-out-btn" onClick={handleSignOut}>
          Sign Out
        </button>
      </div>

      <div className="popup-content">
        <div className="user-info">
          <p>Signed in as: {user.email}</p>
        </div>

        <div className="form-section">
          <h3>Your Information</h3>
          <div className="form-group">
            <label>First Name</label>
            <input
              type="text"
              value={userData.firstName || ''}
              onChange={(e) => setUserData({ ...userData, firstName: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Last Name</label>
            <input
              type="text"
              value={userData.lastName || ''}
              onChange={(e) => setUserData({ ...userData, lastName: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={userData.email || ''}
              onChange={(e) => setUserData({ ...userData, email: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              value={userData.phone || ''}
              onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
            />
          </div>
        </div>

        <div className="action-buttons">
          <button onClick={handleSave} className="save-btn">
            Save Data
          </button>
          <button onClick={handleFill} className="fill-btn" disabled={filling}>
            {filling ? 'Filling...' : 'Fill Current Page'}
          </button>
        </div>
      </div>
    </div>
  );
}

async function sendMessageToTab(tabId: number, message: any) {
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

