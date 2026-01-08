/**
 * @module @dreamer/storage
 *
 * 存储工具库，提供统一的存储抽象层，支持多种存储后端。
 *
 * 特性：
 * - 文件存储（服务端）
 * - 键值对存储（服务端和客户端）
 * - 存储适配器模式
 * - TTL 支持
 * - LRU 缓存策略
 * - 批量操作
 *
 * 环境兼容性：
 * - 服务端：✅ 支持（Deno 和 Bun 运行时，文件存储功能）
 * - 客户端：✅ 支持（浏览器环境，通过 `jsr:@dreamer/storage/client` 使用）
 */

// 导入 runtime-adapter 提供的文件系统 API（兼容 Deno 和 Bun）
import {
  mkdir,
  readdir,
  readFile,
  remove,
  stat,
  writeFile,
} from "@dreamer/runtime-adapter";

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
 * 存储适配器接口（服务端）
 */
export interface StorageAdapter {
  /**
   * 读取数据
   */
  read(key: string): Promise<Uint8Array | null>;

  /**
   * 写入数据
   */
  write(key: string, data: Uint8Array): Promise<void>;

  /**
   * 删除数据
   */
  delete(key: string): Promise<void>;

  /**
   * 检查键是否存在
   */
  exists(key: string): Promise<boolean>;

  /**
   * 列出所有键（可选前缀）
   */
  list(prefix?: string): Promise<string[]>;
}

/**
 * 文件存储适配器（基于文件系统）
 */
export class FileStorageAdapter implements StorageAdapter {
  public readonly basePath: string;

  constructor(options: { basePath: string }) {
    this.basePath = options.basePath;
    // 确保基础目录存在
    this.ensureBasePath();
  }

  /**
   * 确保基础目录存在
   */
  private async ensureBasePath(): Promise<void> {
    try {
      await mkdir(this.basePath, { recursive: true });
    } catch (error: any) {
      // 检查是否是目录已存在的错误（Deno 和 Bun 的错误码不同）
      if (
        error?.code !== "EEXIST" && !error?.message?.includes("already exists")
      ) {
        throw error;
      }
    }
  }

  /**
   * 获取完整文件路径
   */
  private getFullPath(key: string): string {
    // 规范化路径，防止路径遍历攻击
    const normalized = key.replace(/\.\./g, "").replace(/^\//, "");
    return `${this.basePath}/${normalized}`;
  }

  /**
   * 读取文件
   */
  async read(key: string): Promise<Uint8Array | null> {
    try {
      const path = this.getFullPath(key);
      return await readFile(path);
    } catch (error: any) {
      // 检查是否是文件不存在的错误（Deno 和 Bun 的错误码不同）
      if (error?.code === "ENOENT" || error?.name === "NotFound") {
        return null;
      }
      throw error;
    }
  }

  /**
   * 写入文件
   */
  async write(key: string, data: Uint8Array): Promise<void> {
    const path = this.getFullPath(key);
    // 确保目录存在
    const dir = path.substring(0, path.lastIndexOf("/"));
    if (dir) {
      await mkdir(dir, { recursive: true });
    }
    await writeFile(path, data);
  }

  /**
   * 删除文件
   */
  async delete(key: string): Promise<void> {
    try {
      const path = this.getFullPath(key);
      await remove(path);
    } catch (error: any) {
      // 检查是否是文件不存在的错误（Deno 和 Bun 的错误码不同）
      if (error?.code !== "ENOENT" && error?.name !== "NotFound") {
        throw error;
      }
    }
  }

  /**
   * 检查文件是否存在
   */
  async exists(key: string): Promise<boolean> {
    try {
      const path = this.getFullPath(key);
      const fileStat = await stat(path);
      return fileStat.isFile;
    } catch {
      return false;
    }
  }

  /**
   * 列出所有文件
   */
  async list(prefix?: string): Promise<string[]> {
    const basePath = this.basePath;
    const prefixPath = prefix ? this.getFullPath(prefix) : basePath;
    const files: string[] = [];

    async function walkDir(dir: string, relativePrefix: string): Promise<void> {
      try {
        const entries = await readdir(dir);
        for (const entry of entries) {
          const fullPath = `${dir}/${entry.name}`;
          const relativePath = relativePrefix
            ? `${relativePrefix}/${entry.name}`
            : entry.name;

          if (entry.isFile) {
            files.push(relativePath);
          } else if (entry.isDirectory) {
            await walkDir(fullPath, relativePath);
          }
        }
      } catch (error: any) {
        // 检查是否是目录不存在的错误（Deno 和 Bun 的错误码不同）
        if (error?.code !== "ENOENT" && error?.name !== "NotFound") {
          throw error;
        }
      }
    }

    await walkDir(prefixPath, prefix || "");
    return files;
  }
}

/**
 * 文件存储（服务端）
 */
export class FileStorage {
  private adapter: StorageAdapter;

  constructor(options: { basePath?: string; adapter?: StorageAdapter }) {
    if (options.adapter) {
      this.adapter = options.adapter;
    } else {
      this.adapter = new FileStorageAdapter({
        basePath: options.basePath || "./storage",
      });
    }
  }

  /**
   * 写入文件（支持对象自动序列化）
   */
  async write(
    key: string,
    data: string | Uint8Array | object,
  ): Promise<void> {
    let bytes: Uint8Array;
    if (typeof data === "string") {
      bytes = new TextEncoder().encode(data);
    } else if (data instanceof Uint8Array) {
      bytes = data;
    } else {
      bytes = new TextEncoder().encode(JSON.stringify(data));
    }
    await this.adapter.write(key, bytes);
  }

  /**
   * 读取文件（支持自动反序列化）
   */
  async read<T = unknown>(key: string): Promise<T | null> {
    const bytes = await this.adapter.read(key);
    if (!bytes) {
      return null;
    }
    try {
      const text = new TextDecoder().decode(bytes);
      return JSON.parse(text) as T;
    } catch {
      // 如果不是 JSON，返回原始文本
      return new TextDecoder().decode(bytes) as T;
    }
  }

  /**
   * 读取原始字节
   */
  async readBytes(key: string): Promise<Uint8Array | null> {
    return await this.adapter.read(key);
  }

  /**
   * 检查文件是否存在
   */
  async exists(key: string): Promise<boolean> {
    return await this.adapter.exists(key);
  }

  /**
   * 删除文件
   */
  async delete(key: string): Promise<void> {
    await this.adapter.delete(key);
  }

  /**
   * 列出目录下的所有文件
   */
  async list(prefix?: string): Promise<string[]> {
    return await this.adapter.list(prefix);
  }

  /**
   * 创建目录
   */
  async mkdir(path: string): Promise<void> {
    if (this.adapter instanceof FileStorageAdapter) {
      const fullPath = `${this.adapter.basePath}/${path}`;
      await mkdir(fullPath, { recursive: true });
    } else {
      throw new Error("mkdir is only supported with FileStorageAdapter");
    }
  }

  /**
   * 删除目录
   */
  async rmdir(path: string): Promise<void> {
    if (this.adapter instanceof FileStorageAdapter) {
      const fullPath = `${this.adapter.basePath}/${path}`;
      try {
        await remove(fullPath, { recursive: true });
      } catch (error: any) {
        // 检查是否是目录不存在的错误（Deno 和 Bun 的错误码不同）
        if (error?.code !== "ENOENT" && error?.name !== "NotFound") {
          throw error;
        }
      }
    } else {
      throw new Error("rmdir is only supported with FileStorageAdapter");
    }
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
 * 键值对存储（服务端，基于文件系统）
 */
export class KeyValueStorage {
  private adapter: StorageAdapter;
  private cache: Map<string, { value: unknown; expiresAt?: number }> =
    new Map();

  constructor(options: { basePath?: string; adapter?: StorageAdapter }) {
    if (options.adapter) {
      this.adapter = options.adapter;
    } else {
      this.adapter = new FileStorageAdapter({
        basePath: options.basePath || "./kv-storage",
      });
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

    // 写入文件
    const data = new TextEncoder().encode(JSON.stringify(item));
    await this.adapter.write(key, data);
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
        await this.adapter.delete(key);
        return null;
      }
      return cached.value as T;
    }

    // 从文件读取
    const bytes = await this.adapter.read(key);
    if (!bytes) {
      return null;
    }

    try {
      const item = JSON.parse(new TextDecoder().decode(bytes)) as KeyValueItem;

      // 检查过期
      if (item.expiresAt && item.expiresAt < Date.now()) {
        await this.adapter.delete(key);
        return null;
      }

      // 更新缓存
      this.cache.set(key, item);

      return item.value as T;
    } catch {
      return null;
    }
  }

  /**
   * 检查键是否存在
   */
  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  /**
   * 删除键
   */
  async delete(key: string): Promise<void> {
    this.cache.delete(key);
    await this.adapter.delete(key);
  }

  /**
   * 获取所有键
   */
  async keys(): Promise<string[]> {
    return await this.adapter.list();
  }

  /**
   * 清空所有数据
   */
  async clear(): Promise<void> {
    this.cache.clear();
    const keys = await this.adapter.list();
    for (const key of keys) {
      await this.adapter.delete(key);
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
