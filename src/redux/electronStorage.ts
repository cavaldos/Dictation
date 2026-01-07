/**
 * Custom storage adapter for redux-persist
 * Uses electron-store on Electron app, falls back to localStorage on web
 */

const isElectron = (): boolean => {
  return typeof window !== 'undefined' && 
         typeof window.electronAPI !== 'undefined' &&
         typeof window.electronAPI.storeGet === 'function';
};

interface Storage {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

const createElectronStorage = (): Storage => ({
  getItem: async (key: string): Promise<string | null> => {
    try {
      const value = await window.electronAPI.storeGet(key);
      return value;
    } catch (error) {
      console.error('electronStorage getItem error:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await window.electronAPI.storeSet(key, value);
    } catch (error) {
      console.error('electronStorage setItem error:', error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await window.electronAPI.storeRemove(key);
    } catch (error) {
      console.error('electronStorage removeItem error:', error);
    }
  },
});

const createWebStorage = (): Storage => ({
  getItem: async (key: string): Promise<string | null> => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('localStorage getItem error:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('localStorage setItem error:', error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('localStorage removeItem error:', error);
    }
  },
});

// Export the appropriate storage based on environment
const electronStorage: Storage = isElectron() 
  ? createElectronStorage() 
  : createWebStorage();

export default electronStorage;
