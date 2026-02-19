# @dreamer/storage

> 📖 English | [中文文档 (Chinese)](./docs/zh-CN/README.md)

> A storage utility library compatible with Deno and Bun, providing a unified
> storage interface and server-side file storage.

[![JSR](https://jsr.io/badges/@dreamer/storage)](https://jsr.io/@dreamer/storage)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](./LICENSE)

---

## 🎯 Overview

Storage utility library providing a unified storage abstraction layer with
server-side file storage support.

## Features

- **File storage**:
  - File read/write
  - Directory create/delete
  - File/directory listing
  - File permission handling
  - File metadata operations
- **Key-value storage**:
  - File-based key-value storage
  - Redis-like API
  - TTL (time-to-live) support
  - LRU cache policy support
- **Storage adapters**:
  - File system adapter (default)
  - Extensible adapter interface
  - Custom storage backends
- **Service container integration**:
  - `@dreamer/service` dependency injection
  - StorageManager for multiple storage instances
  - `createStorageManager` factory

## Design principles

__All @dreamer/_ packages follow these principles_*:

- **Main package (@dreamer/xxx)**: For server-side (Deno and Bun runtimes)
- **Client sub-package (@dreamer/xxx/client)**: For client-side (browser)

This provides:

- Clear separation of server and client code
- No server-only dependencies in client bundles
- Better type safety and editor support
- Better tree-shaking

## Use cases

- **File storage**: Uploads, file management, static assets
- **Persistence**: App data, configuration
- **Caching**: File cache, data cache
- **Log storage**: Log file management

## Installation

```bash
deno add jsr:@dreamer/storage
```

## Environment compatibility

- **Runtime**: Deno 2.6+ or Bun 1.3.5+
- **Server**: ✅ Supported (Deno and Bun, file storage via file system API)
- **Client**: ✅ Supported (browser; use `jsr:@dreamer/storage/client` for
  browser storage API)
- **Dependencies**: No external dependencies (pure TypeScript)

---

## 🚀 Quick start

### File storage

```typescript
import { FileStorage } from "jsr:@dreamer/storage";

// Create file storage instance
const storage = new FileStorage({
  basePath: "./storage", // Storage root
});

// Write file
await storage.write("users/123.json", {
  id: 123,
  name: "Alice",
  email: "alice@example.com",
});

// Read file
const user = await storage.read("users/123.json");
console.log(user); // { id: 123, name: "Alice", email: "alice@example.com" }

// Check if file exists
const exists = await storage.exists("users/123.json");
console.log(exists); // true

// Delete file
await storage.delete("users/123.json");

// List files in directory
const files = await storage.list("users");
console.log(files); // ["123.json", "456.json", ...]

// Create directory
await storage.mkdir("logs/2024");

// Delete directory
await storage.rmdir("logs/2024");
```

### Key-value storage

```typescript
import { KeyValueStorage } from "jsr:@dreamer/storage";

// Create key-value storage (file-backed)
const kv = new KeyValueStorage({
  basePath: "./kv-storage",
});

// Set value with TTL
await kv.set("user:123", { name: "Alice", age: 30 }, {
  ttl: 3600, // Expires in 1 hour
});

// Get value
const user = await kv.get("user:123");
console.log(user); // { name: "Alice", age: 30 }

// Check if key exists
const exists = await kv.has("user:123");
console.log(exists); // true

// Delete key
await kv.delete("user:123");

// Get all keys
const keys = await kv.keys();
console.log(keys); // ["user:123", "user:456", ...]

// Clear all data
await kv.clear();
```

### Storage adapters

```typescript
import { FileStorageAdapter, StorageAdapter } from "jsr:@dreamer/storage";

// Default file system adapter
const adapter = new FileStorageAdapter({
  basePath: "./storage",
});

// Or implement a custom adapter
class CustomStorageAdapter implements StorageAdapter {
  async read(key: string): Promise<Uint8Array | null> {
    // Custom read logic
  }

  async write(key: string, data: Uint8Array): Promise<void> {
    // Custom write logic
  }

  async delete(key: string): Promise<void> {
    // Custom delete logic
  }

  async exists(key: string): Promise<boolean> {
    // Custom exists logic
  }

  async list(prefix?: string): Promise<string[]> {
    // Custom list logic
  }
}

const customAdapter = new CustomStorageAdapter();
const storage = new FileStorage({ adapter: customAdapter });
```

## Storage adapter interface

All storage adapters implement a unified interface:

```typescript
interface StorageAdapter {
  // Read data
  get(key: string): Promise<any> | any;

  // Write data
  set(key: string, value: any, options?: StorageOptions): Promise<void> | void;

  // Delete data
  delete(key: string): Promise<void> | void;

  // Check if key exists
  has(key: string): Promise<boolean> | boolean;

  // Get all keys
  keys(): Promise<string[]> | string[];

  // Clear all data
  clear(): Promise<void> | void;
}

interface StorageOptions {
  ttl?: number; // Time-to-live (seconds)
  [key: string]: any;
}
```

## 🔗 ServiceContainer integration

### Using the createStorageManager factory

```typescript
import { ServiceContainer } from "@dreamer/service";
import { createStorageManager, StorageManager } from "@dreamer/storage";

// Create service container
const container = new ServiceContainer();

// Register StorageManager
container.registerSingleton(
  "storage:main",
  () => createStorageManager({ name: "main" }),
);

// Get StorageManager
const manager = container.get<StorageManager>("storage:main");

// Use storage
const fileStorage = manager.getFileStorage("uploads");
const kvStorage = manager.getKVStorage("cache");
```

### StorageManager API

| Method                            | Description                       |
| --------------------------------- | --------------------------------- |
| `getName()`                       | Get manager name                  |
| `setContainer(container)`         | Set service container             |
| `getContainer()`                  | Get service container             |
| `fromContainer(container, name?)` | Get instance from container       |
| `getFileStorage(name, basePath?)` | Get or create file storage        |
| `getKVStorage(name, basePath?)`   | Get or create key-value storage   |
| `hasFileStorage(name)`            | Check if file storage exists      |
| `hasKVStorage(name)`              | Check if key-value storage exists |
| `removeFileStorage(name)`         | Remove file storage               |
| `removeKVStorage(name)`           | Remove key-value storage          |
| `getFileStorageNames()`           | Get all file storage names        |
| `getKVStorageNames()`             | Get all key-value storage names   |
| `clear()`                         | Clear all storage instances       |

## Performance

- **Batch operations**: Batch read/write to reduce I/O
- **Caching**: Built-in LRU cache for faster reads
- **Async**: All operations are async and non-blocking
- **Memory**: Expired data cleaned up to avoid leaks

## Client support

For client (browser) storage, see
[client documentation](./docs/en-US/client/README.md) (EN) or
[客户端文档](./docs/zh-CN/client/README.md) (中文).

## 📝 Notes

- **Server vs client**: `/client` subpath clearly separates server and client
  code
- **Unified API**: Same API on server and client for consistency
- **Adapter pattern**: Multiple backends, easy to extend
- **Type safety**: Full TypeScript types
- **No external deps**: Pure TypeScript, no extra libraries

---

## Documentation

- **Full documentation (English)**: This README
- **Full documentation (中文)**: [docs/zh-CN/README.md](./docs/zh-CN/README.md)
- **Test report (EN)**: [docs/en-US/TEST_REPORT.md](./docs/en-US/TEST_REPORT.md)
- **Test report (中文)**:
  [docs/zh-CN/TEST_REPORT.md](./docs/zh-CN/TEST_REPORT.md)

---

## 📋 Changelog

**v1.0.0** (2026-02-19): Initial stable release. Server: FileStorage,
KeyValueStorage, FileStorageAdapter, StorageManager, createStorageManager,
@dreamer/service integration. Client: BrowserStorage, KeyValueStorage (browser),
localStorage/sessionStorage/IndexedDB adapters. See
[CHANGELOG.md](./docs/en-US/CHANGELOG.md) for full details.

---

## 🤝 Contributing

Issues and Pull Requests are welcome.

---

## 📄 License

Apache License 2.0 — see [LICENSE](./LICENSE)

---

<div align="center">**Made with ❤️ by Dreamer Team**</div>
