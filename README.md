# @dreamer/storage

一个用于 Deno 的存储工具库，提供统一的存储接口，支持服务端文件存储。

## 功能

存储工具库，提供统一的存储抽象层，支持文件系统存储。

## 特性

- **文件存储**：
  - 文件读写操作
  - 目录创建和删除
  - 文件/目录遍历
  - 文件权限管理
  - 文件元数据操作
- **键值对存储**：
  - 基于文件的键值存储
  - 类似 Redis 的接口
  - 支持 TTL（过期时间）
  - 支持 LRU 缓存策略
- **存储适配器**：
  - 文件系统适配器（默认）
  - 可扩展的适配器接口
  - 支持自定义存储后端

## 设计原则

**所有 @dreamer/* 库都遵循以下原则**：

- **主包（@dreamer/xxx）**：用于服务端（Deno 运行时）
- **客户端子包（@dreamer/xxx/client）**：用于客户端（浏览器环境）

这样可以：
- 明确区分服务端和客户端代码
- 避免在客户端代码中引入服务端依赖
- 提供更好的类型安全和代码提示
- 支持更好的 tree-shaking

## 使用场景

- **文件存储**：文件上传、文件管理、静态资源存储
- **数据持久化**：应用数据存储、配置存储
- **缓存**：文件缓存、数据缓存
- **日志存储**：日志文件管理

## 优先级

⭐⭐⭐⭐

## 安装

```bash
deno add jsr:@dreamer/storage
```

## 环境兼容性

- **Deno 版本**：要求 Deno 2.5 或更高版本
- **服务端**：✅ 支持（Deno 运行时，文件存储功能，使用文件系统 API）
- **客户端**：✅ 支持（浏览器环境，通过 `jsr:@dreamer/storage/client` 使用浏览器存储 API）
- **依赖**：无外部依赖（纯 TypeScript 实现）

## 使用示例

### 文件存储

```typescript
import { FileStorage } from "jsr:@dreamer/storage";

// 创建文件存储实例
const storage = new FileStorage({
  basePath: "./storage", // 存储根目录
});

// 写入文件
await storage.write("users/123.json", {
  id: 123,
  name: "Alice",
  email: "alice@example.com",
});

// 读取文件
const user = await storage.read("users/123.json");
console.log(user); // { id: 123, name: "Alice", email: "alice@example.com" }

// 检查文件是否存在
const exists = await storage.exists("users/123.json");
console.log(exists); // true

// 删除文件
await storage.delete("users/123.json");

// 列出目录下的所有文件
const files = await storage.list("users");
console.log(files); // ["123.json", "456.json", ...]

// 创建目录
await storage.mkdir("logs/2024");

// 删除目录
await storage.rmdir("logs/2024");
```

### 键值对存储

```typescript
import { KeyValueStorage } from "jsr:@dreamer/storage";

// 创建键值存储实例（基于文件系统）
const kv = new KeyValueStorage({
  basePath: "./kv-storage",
});

// 设置值（带 TTL）
await kv.set("user:123", { name: "Alice", age: 30 }, {
  ttl: 3600, // 1 小时后过期
});

// 获取值
const user = await kv.get("user:123");
console.log(user); // { name: "Alice", age: 30 }

// 检查键是否存在
const exists = await kv.has("user:123");
console.log(exists); // true

// 删除键
await kv.delete("user:123");

// 获取所有键
const keys = await kv.keys();
console.log(keys); // ["user:123", "user:456", ...]

// 清空所有数据
await kv.clear();
```

### 存储适配器

```typescript
import { StorageAdapter, FileStorageAdapter } from "jsr:@dreamer/storage";

// 使用默认的文件系统适配器
const adapter = new FileStorageAdapter({
  basePath: "./storage",
});

// 或者实现自定义适配器
class CustomStorageAdapter implements StorageAdapter {
  async read(key: string): Promise<Uint8Array | null> {
    // 自定义读取逻辑
  }

  async write(key: string, data: Uint8Array): Promise<void> {
    // 自定义写入逻辑
  }

  async delete(key: string): Promise<void> {
    // 自定义删除逻辑
  }

  async exists(key: string): Promise<boolean> {
    // 自定义存在检查逻辑
  }

  async list(prefix?: string): Promise<string[]> {
    // 自定义列表逻辑
  }
}

const customAdapter = new CustomStorageAdapter();
const storage = new FileStorage({ adapter: customAdapter });
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

## 性能优化

- **批量操作**：支持批量读写，减少 I/O 操作
- **缓存机制**：内置 LRU 缓存，提高读取性能
- **异步操作**：所有操作都是异步的，不阻塞主线程
- **内存管理**：及时清理过期数据，避免内存泄漏

## 客户端支持

客户端存储支持请查看 [client/README.md](./src/client/README.md)。

## 备注

- **服务端和客户端分离**：通过 `/client` 子路径明确区分服务端和客户端代码
- **统一接口**：服务端和客户端使用相同的 API 接口，降低学习成本
- **适配器模式**：支持多种存储后端，易于扩展
- **类型安全**：完整的 TypeScript 类型支持
- **无外部依赖**：纯 TypeScript 实现，不依赖外部库
