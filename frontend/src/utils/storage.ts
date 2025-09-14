// IndexedDB and localStorage utilities for persisting timeline and media files

interface MediaFileRecord {
  id: string;
  blob: Blob;
  fileName: string;
  createdAt: number;
}

class StorageManager {
  private dbName = 'VibeMovieDB';
  private dbVersion = 1;
  private storeName = 'mediaFiles';
  private db: IDBDatabase | null = null;

  // Initialize IndexedDB
  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  // Save media file to IndexedDB
  async saveMediaFile(id: string, file: File): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const record: MediaFileRecord = {
      id,
      blob: file,
      fileName: file.name,
      createdAt: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Load media file from IndexedDB and create blob URL
  async loadMediaFile(id: string): Promise<string | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        const result = request.result as MediaFileRecord;
        if (result) {
          const url = URL.createObjectURL(result.blob);
          resolve(url);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Get all stored file IDs
  async getStoredFileIds(): Promise<string[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAllKeys();

      request.onsuccess = () => resolve(request.result as string[]);
      request.onerror = () => reject(request.error);
    });
  }

  // Delete media file from IndexedDB
  async deleteMediaFile(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Clean up unused media files
  async cleanupUnusedFiles(activeFileIds: string[]): Promise<void> {
    const storedIds = await this.getStoredFileIds();
    const unusedIds = storedIds.filter(id => !activeFileIds.includes(id));

    for (const id of unusedIds) {
      await this.deleteMediaFile(id);
    }

    console.log(`Cleaned up ${unusedIds.length} unused media files`);
  }

  // Clear all stored files (useful for development/reset)
  async clearAllFiles(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Create and export singleton instance
export const storageManager = new StorageManager();

// Utility functions
export const initStorage = async (): Promise<void> => {
  try {
    await storageManager.init();
    console.log('Storage manager initialized successfully');
  } catch (error) {
    console.error('Failed to initialize storage:', error);
    throw error;
  }
};

export const saveMediaFile = async (id: string, file: File): Promise<void> => {
  return storageManager.saveMediaFile(id, file);
};

export const loadMediaFile = async (id: string): Promise<string | null> => {
  return storageManager.loadMediaFile(id);
};

export const cleanupUnusedFiles = async (activeFileIds: string[]): Promise<void> => {
  return storageManager.cleanupUnusedFiles(activeFileIds);
};

// Generate stable ID for files
export const generateFileId = (): string => {
  return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Check if storage is available
export const isStorageAvailable = (): boolean => {
  try {
    return typeof Storage !== 'undefined' && typeof indexedDB !== 'undefined';
  } catch {
    return false;
  }
};