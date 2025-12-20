export interface UserData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  location?: string;
  github?: string;
  linkedin?: string;
  resume?: string;
  coverLetter?: string;
  [key: string]: any;
}

export const storage = {
  async get(key: string): Promise<any> {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        resolve(result[key]);
      });
    });
  },

  async set(key: string, value: any): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, () => {
        resolve();
      });
    });
  },

  async getUserData(): Promise<UserData> {
    const data = await this.get('userData');
    return data || {};
  },

  async setUserData(data: UserData): Promise<void> {
    await this.set('userData', data);
  },

  async clear(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.clear(() => {
        resolve();
      });
    });
  }
};

