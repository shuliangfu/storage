# @dreamer/storage/client

> 一个用于浏览器的存储工具库，提供统一的存储接口，支持
> localStorage、sessionStorage 和 IndexedDB

[![JSR](https://jsr.io/badges/@dreamer/storage/client)](https://jsr.io/@dreamer/storage/client)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](../../LICENSE)

---

## 服务端支持

服务端存储支持请查看 [服务端文档](../../README.md)。

## 功能

客户端存储工具库，提供统一的存储抽象层，支持多种浏览器存储后端。

## 特性

- **浏览器存储封装**：
  - localStorage 封装
  - sessionStorage 封装
  - IndexedDB 封装
  - 统一的存储接口
- **键值对存储**：
  - 基于浏览器存储的键值接口
  - 支持 TTL（过期时间）
  - 支持 LRU 缓存策略
  - 自动序列化/反序列化
- **存储适配器**：
  - localStorage 适配器（默认）
  - sessionStorage 适配器
  - IndexedDB 适配器
  - 可扩展的适配器接口

## 安装

```bash
deno add jsr:@dreamer/storage/client
```

## 环境兼容性

- **Deno 版本**：要求 Deno 2.5 或更高版本
- **环境**：✅ 支持（浏览器环境）
- **依赖**：无外部依赖

## 🚀 快速开始

### 浏览器存储封装

```typescript
import { BrowserStorage } from "jsr:@dreamer/storage/client";

// 创建基于 localStorage 的存储实例
const storage = new BrowserStorage({
  adapter: "localStorage", // 或 "sessionStorage"、"indexedDB"
});

// 写入数据
await storage.set("user", {
  id: 123,
  name: "Alice",
  email: "alice@example.com",
});

// 读取数据
const user = await storage.get("user");
console.log(user); // { id: 123, name: "Alice", email: "alice@example.com" }

// 检查键是否存在
const exists = await storage.has("user");
console.log(exists); // true

// 删除数据
await storage.delete("user");

// 获取所有键
const keys = await storage.keys();
console.log(keys); // ["user", "settings", ...]

// 清空所有数据
await storage.clear();
```

### 键值对存储（带 TTL）

```typescript
import { KeyValueStorage } from "jsr:@dreamer/storage/client";

// 创建键值存储实例（基于 localStorage）
const kv = new KeyValueStorage({
  adapter: "localStorage",
});

// 设置值（带 TTL）
await kv.set("token", "abc123", {
  ttl: 3600, // 1 小时后过期
});

// 获取值（自动检查过期）
const token = await kv.get("token");
console.log(token); // "abc123" 或 null（如果已过期）

// 设置值（永久存储）
await kv.set("user", { name: "Alice" });

// 批量操作
await kv.setMany({
  "key1": "value1",
  "key2": "value2",
  "key3": "value3",
});

const values = await kv.getMany(["key1", "key2", "key3"]);
console.log(values); // { key1: "value1", key2: "value2", key3: "value3" }
```

### 使用不同的存储适配器

```typescript
import { BrowserStorage } from "jsr:@dreamer/storage/client";

// localStorage（持久化，跨会话）
const localStorage = new BrowserStorage({
  adapter: "localStorage",
});

// sessionStorage（临时，仅当前会话）
const sessionStorage = new BrowserStorage({
  adapter: "sessionStorage",
});

// IndexedDB（大容量存储）
const indexedDB = new BrowserStorage({
  adapter: "indexedDB",
  dbName: "myApp",
  version: 1,
});

// 使用示例
await localStorage.set("user", userData); // 持久化存储
await sessionStorage.set("temp", tempData); // 临时存储
await indexedDB.set("largeData", largeData); // 大容量存储
```

### 存储适配器切换

```typescript
import { BrowserStorage, StorageAdapter } from "jsr:@dreamer/storage/client";

// 实现自定义适配器
class CustomBrowserAdapter implements StorageAdapter {
  async get(key: string): Promise<any> {
    // 自定义读取逻辑
    return JSON.parse(localStorage.getItem(key) || "null");
  }

  async set(key: string, value: any): Promise<void> {
    // 自定义写入逻辑
    localStorage.setItem(key, JSON.stringify(value));
  }

  async delete(key: string): Promise<void> {
    localStorage.removeItem(key);
  }

  async clear(): Promise<void> {
    localStorage.clear();
  }

  async keys(): Promise<string[]> {
    return Object.keys(localStorage);
  }
}

const storage = new BrowserStorage({
  adapter: new CustomBrowserAdapter(),
});
```

## 存储适配器接口

所有存储适配器都实现统一的接口：

```typescript
interface StorageAdapter {
  // 读取数据
  get(key: string): Promise<any> | any;

  // 写入数据
  set(key: string, value: any, options?: StorageOptions): Promise<void> | void;

  // 删除数据
  delete(key: string): Promise<void> | void;

  // 检查键是否存在
  has(key: string): Promise<boolean> | boolean;

  // 获取所有键
  keys(): Promise<string[]> | string[];

  // 清空所有数据
  clear(): Promise<void> | void;
}

interface StorageOptions {
  ttl?: number; // 过期时间（秒）
  [key: string]: any;
}
```

## 使用场景

- **本地数据存储**：用户设置、应用状态
- **离线数据缓存**：离线数据存储、数据同步
- **临时数据存储**：表单数据、会话数据
- **配置存储**：用户偏好、主题设置

## 性能优化

- **批量操作**：支持批量读写，减少 I/O 操作
- **缓存机制**：内置 LRU 缓存，提高读取性能
- **异步操作**：所有操作都是异步的，不阻塞主线程
- **内存管理**：及时清理过期数据，避免内存泄漏

---

## 📝 备注

- **统一接口**：与服务端使用相同的 API 接口，降低学习成本
- **适配器模式**：支持多种存储后端，易于扩展
- **类型安全**：完整的 TypeScript 类型支持
- **无外部依赖**：纯 TypeScript 实现

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 许可证

Apache License 2.0 - 详见 [LICENSE](../../../LICENSE)

---

<div align="center">

**Made with ❤️ by Dreamer Team**

</div>
