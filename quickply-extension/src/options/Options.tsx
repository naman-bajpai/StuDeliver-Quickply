import React, { useState, useEffect } from 'react';
import { signIn, signUp, getCurrentUser, signOut } from '../lib/auth';
import { storage, UserData } from '../lib/storage';
import './options.css';

export default function Options() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<UserData>({});
  const [loading, setLoading] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      
      if (currentUser) {
        const data = await storage.getUserData();
        setUserData(data);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    try {
      if (isSignUp) {
        await signUp(email, password);
        alert('Account created! Please check your email to verify your account.');
      } else {
        await signIn(email, password);
      }
      await loadUserData();
      setEmail('');
      setPassword('');
    } catch (error: any) {
      setError(error.message || 'Authentication failed');
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
      setUser(null);
      setUserData({});
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
    return <div className="options-container">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="options-container">
        <div className="auth-section">
          <h1>JobFill Extension</h1>
          <h2>{isSignUp ? 'Sign Up' : 'Sign In'}</h2>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleAuth}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="auth-btn">
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>
          
          <p className="toggle-auth">
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="options-container">
      <div className="options-header">
        <h1>JobFill Extension Settings</h1>
        <button className="sign-out-btn" onClick={handleSignOut}>
          Sign Out
        </button>
      </div>

      <div className="user-section">
        <h2>Account</h2>
        <p>Signed in as: <strong>{user.email}</strong></p>
      </div>

      <div className="data-section">
        <h2>Your Information</h2>
        <p className="section-description">
          Fill in your information below. This data will be used to automatically fill job application forms.
        </p>

        <div className="form-grid">
          <div className="form-group">
            <label>First Name</label>
            <input
              type="text"
              value={userData.firstName || ''}
              onChange={(e) => setUserData({ ...userData, firstName: e.target.value })}
              placeholder="John"
            />
          </div>

          <div className="form-group">
            <label>Last Name</label>
            <input
              type="text"
              value={userData.lastName || ''}
              onChange={(e) => setUserData({ ...userData, lastName: e.target.value })}
              placeholder="Doe"
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={userData.email || ''}
              onChange={(e) => setUserData({ ...userData, email: e.target.value })}
              placeholder="john.doe@example.com"
            />
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              value={userData.phone || ''}
              onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div className="form-group full-width">
            <label>Address</label>
            <input
              type="text"
              value={userData.address || ''}
              onChange={(e) => setUserData({ ...userData, address: e.target.value })}
              placeholder="123 Main Street"
            />
          </div>

          <div className="form-group">
            <label>City</label>
            <input
              type="text"
              value={userData.city || ''}
              onChange={(e) => setUserData({ ...userData, city: e.target.value })}
              placeholder="New York"
            />
          </div>

          <div className="form-group">
            <label>State</label>
            <input
              type="text"
              value={userData.state || ''}
              onChange={(e) => setUserData({ ...userData, state: e.target.value })}
              placeholder="NY"
            />
          </div>

          <div className="form-group">
            <label>Zip Code</label>
            <input
              type="text"
              value={userData.zipCode || ''}
              onChange={(e) => setUserData({ ...userData, zipCode: e.target.value })}
              placeholder="10001"
            />
          </div>

          <div className="form-group">
            <label>Country</label>
            <input
              type="text"
              value={userData.country || ''}
              onChange={(e) => setUserData({ ...userData, country: e.target.value })}
              placeholder="United States"
            />
          </div>
        </div>

        <button onClick={handleSave} className="save-btn">
          Save Information
        </button>
      </div>
    </div>
  );
}

