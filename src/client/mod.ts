/**
 * @module @dreamer/storage/client
 *
 * 客户端存储工具库，提供浏览器存储的统一接口。
 *
 * 特性：
 * - localStorage 封装
 * - sessionStorage 封装
 * - IndexedDB 封装
 * - 键值对存储（带 TTL）
 * - 自动序列化/反序列化
 * - 批量操作
 *
 * 环境兼容性：
 * - 服务端：❌ 不支持（Deno 运行时）
 * - 客户端：✅ 支持（浏览器环境）
 */


/**
 * 存储选项
 */
export interface StorageOptions {
  /** 过期时间（秒） */
  ttl?: number;
  /** 其他选项 */
  [key: string]: unknown;
}

/**
 * 浏览器存储适配器接口
 */
export interface BrowserStorageAdapter {
  /**
   * 获取值
   */
  get(key: string): Promise<unknown> | unknown;

  /**
   * 设置值
   */
  set(key: string, value: unknown): Promise<void> | void;

  /**
   * 删除值
   */
  delete(key: string): Promise<void> | void;

  /**
   * 检查键是否存在
   */
  has(key: string): Promise<boolean> | boolean;

  /**
   * 获取所有键
   */
  keys(): Promise<string[]> | string[];

  /**
   * 清空所有数据
   */
  clear(): Promise<void> | void;
}

/**
 * localStorage 适配器
 */
export class LocalStorageAdapter implements BrowserStorageAdapter {
  get(key: string): unknown {
    const value = globalThis.localStorage.getItem(key);
    if (value === null) {
      return null;
    }
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  set(key: string, value: unknown): void {
    const serialized = typeof value === "string"
      ? value
      : JSON.stringify(value);
    globalThis.localStorage.setItem(key, serialized);
  }

  delete(key: string): void {
    globalThis.localStorage.removeItem(key);
  }

  has(key: string): boolean {
    return globalThis.localStorage.getItem(key) !== null;
  }

  keys(): string[] {
    return Object.keys(globalThis.localStorage);
  }

  clear(): void {
    globalThis.localStorage.clear();
  }
}

/**
 * sessionStorage 适配器
 */
export class SessionStorageAdapter implements BrowserStorageAdapter {
  get(key: string): unknown {
    const value = globalThis.sessionStorage.getItem(key);
    if (value === null) {
      return null;
    }
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  set(key: string, value: unknown): void {
    const serialized = typeof value === "string"
      ? value
      : JSON.stringify(value);
    globalThis.sessionStorage.setItem(key, serialized);
  }

  delete(key: string): void {
    globalThis.sessionStorage.removeItem(key);
  }

  has(key: string): boolean {
    return globalThis.sessionStorage.getItem(key) !== null;
  }

  keys(): string[] {
    return Object.keys(globalThis.sessionStorage);
  }

  clear(): void {
    globalThis.sessionStorage.clear();
  }
}

/**
 * IndexedDB 适配器
 */
export class IndexedDBAdapter implements BrowserStorageAdapter {
  private dbName: string;
  private version: number;
  private storeName: string;
  private db: IDBDatabase | null = null;

  constructor(options: {
    dbName: string;
    version?: number;
    storeName?: string;
  }) {
    this.dbName = options.dbName;
    this.version = options.version || 1;
    this.storeName = options.storeName || "default";
  }

  /**
   * 打开数据库
   */
  private openDB(): Promise<IDBDatabase> {
    if (this.db) {
      return Promise.resolve(this.db);
    }

    return new Promise((resolve, reject) => {
      const request = globalThis.indexedDB.open(
        this.dbName,
        this.version,
      );

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }

  async get(key: string): Promise<unknown> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve(request.result || null);
      };
    });
  }

  async set(key: string, value: unknown): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      const request = store.put(value, key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async delete(key: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null && value !== undefined;
  }

  async keys(): Promise<string[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);
      const request = store.getAllKeys();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve(request.result.map((key: IDBValidKey) => String(key)));
      };
    });
  }

  async clear(): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

/**
 * 键值对存储项（带元数据）
 */
interface KeyValueItem {
  value: unknown;
  expiresAt?: number; // 过期时间戳（毫秒）
}

/**
 * 浏览器存储（统一接口）
 */
export class BrowserStorage {
  private adapter: BrowserStorageAdapter;
  private cache: Map<string, { value: unknown; expiresAt?: number }> =
    new Map();

  constructor(options: {
    adapter?:
      | "localStorage"
      | "sessionStorage"
      | "indexedDB"
      | BrowserStorageAdapter;
    dbName?: string;
    version?: number;
    storeName?: string;
  }) {
    if (typeof options.adapter === "object") {
      this.adapter = options.adapter;
    } else if (options.adapter === "sessionStorage") {
      this.adapter = new SessionStorageAdapter();
    } else if (options.adapter === "indexedDB") {
      this.adapter = new IndexedDBAdapter({
        dbName: options.dbName || "dreamer-storage",
        version: options.version,
        storeName: options.storeName,
      });
    } else {
      // 默认使用 localStorage
      this.adapter = new LocalStorageAdapter();
    }
  }

  /**
   * 设置值（带 TTL）
   */
  async set(
    key: string,
    value: unknown,
    options?: StorageOptions,
  ): Promise<void> {
    const item: KeyValueItem = {
      value,
      expiresAt: options?.ttl ? Date.now() + options.ttl * 1000 : undefined,
    };

    // 写入缓存
    this.cache.set(key, item);

    // 写入存储
    const result = this.adapter.set(key, item);
    if (result instanceof Promise) {
      await result;
    }
  }

  /**
   * 获取值（自动检查过期）
   */
  async get<T = unknown>(key: string): Promise<T | null> {
    // 检查缓存
    const cached = this.cache.get(key);
    if (cached) {
      if (cached.expiresAt && cached.expiresAt < Date.now()) {
        // 已过期，删除
        this.cache.delete(key);
        const deleteResult = this.adapter.delete(key);
        if (deleteResult instanceof Promise) {
          await deleteResult;
        }
        return null;
      }
      return cached.value as T;
    }

    // 从存储读取
    const result = this.adapter.get(key);
    const item = result instanceof Promise ? await result : result;

    if (!item || typeof item !== "object") {
      return null;
    }

    const kvItem = item as KeyValueItem;

    // 检查过期
    if (kvItem.expiresAt && kvItem.expiresAt < Date.now()) {
      const deleteResult = this.adapter.delete(key);
      if (deleteResult instanceof Promise) {
        await deleteResult;
      }
      return null;
    }

    // 更新缓存
    this.cache.set(key, kvItem);

    return kvItem.value as T;
  }

  /**
   * 检查键是否存在
   */
  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  /**
   * 删除值
   */
  async delete(key: string): Promise<void> {
    this.cache.delete(key);
    const result = this.adapter.delete(key);
    if (result instanceof Promise) {
      await result;
    }
  }

  /**
   * 获取所有键
   */
  async keys(): Promise<string[]> {
    const result = this.adapter.keys();
    return result instanceof Promise ? await result : result;
  }

  /**
   * 清空所有数据
   */
  async clear(): Promise<void> {
    this.cache.clear();
    const result = this.adapter.clear();
    if (result instanceof Promise) {
      await result;
    }
  }

  /**
   * 批量设置
   */
  async setMany(
    items: Record<string, unknown>,
    options?: StorageOptions,
  ): Promise<void> {
    for (const [key, value] of Object.entries(items)) {
      await this.set(key, value, options);
    }
  }

  /**
   * 批量获取
   */
  async getMany<T = unknown>(keys: string[]): Promise<Record<string, T>> {
    const result: Record<string, T> = {};
    for (const key of keys) {
      const value = await this.get<T>(key);
      if (value !== null) {
        result[key] = value;
      }
    }
    return result;
  }
}

/**
 * 键值对存储（客户端，基于浏览器存储）
 */
export class KeyValueStorage extends BrowserStorage {
  constructor(options: {
    adapter?:
      | "localStorage"
      | "sessionStorage"
      | "indexedDB"
      | BrowserStorageAdapter;
    dbName?: string;
    version?: number;
    storeName?: string;
  }) {
    super(options);
  }
}
