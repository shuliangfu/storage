# @dreamer/storage/client

> A browser storage utility library providing a unified storage interface with
> support for localStorage, sessionStorage, and IndexedDB.

[![JSR](https://jsr.io/badges/@dreamer/storage/client)](https://jsr.io/@dreamer/storage/client)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](../../LICENSE)

---

## Server-side support

For server-side storage support, see the
[server documentation](../../README.md).

## Overview

Client-side storage utility library providing a unified storage abstraction
layer with support for multiple browser storage backends.

## Features

- **Browser storage wrappers**:
  - localStorage wrapper
  - sessionStorage wrapper
  - IndexedDB wrapper
  - Unified storage interface
- **Key-value storage**:
  - Key-value interface based on browser storage
  - TTL (time-to-live) support
  - LRU cache policy support
  - Automatic serialization/deserialization
- **Storage adapters**:
  - localStorage adapter (default)
  - sessionStorage adapter
  - IndexedDB adapter
  - Extensible adapter interface

## Installation

```bash
deno add jsr:@dreamer/storage/client
```

## Environment compatibility

- **Deno version**: Deno 2.5 or higher required
- **Environment**: ✅ Supported (browser environment)
- **Dependencies**: No external dependencies

## 🚀 Quick start

### Browser storage wrapper

```typescript
import { BrowserStorage } from "jsr:@dreamer/storage/client";

// Create a storage instance backed by localStorage
const storage = new BrowserStorage({
  adapter: "localStorage", // or "sessionStorage", "indexedDB"
});

// Write data
await storage.set("user", {
  id: 123,
  name: "Alice",
  email: "alice@example.com",
});

// Read data
const user = await storage.get("user");
console.log(user); // { id: 123, name: "Alice", email: "alice@example.com" }

// Check if key exists
const exists = await storage.has("user");
console.log(exists); // true

// Delete data
await storage.delete("user");

// Get all keys
const keys = await storage.keys();
console.log(keys); // ["user", "settings", ...]

// Clear all data
await storage.clear();
```

### Key-value storage (with TTL)

```typescript
import { KeyValueStorage } from "jsr:@dreamer/storage/client";

// Create key-value storage instance (backed by localStorage)
const kv = new KeyValueStorage({
  adapter: "localStorage",
});

// Set value with TTL
await kv.set("token", "abc123", {
  ttl: 3600, // Expires in 1 hour
});

// Get value (expiry checked automatically)
const token = await kv.get("token");
console.log(token); // "abc123" or null (if expired)

// Set value (persistent)
await kv.set("user", { name: "Alice" });

// Batch operations
await kv.setMany({
  "key1": "value1",
  "key2": "value2",
  "key3": "value3",
});

const values = await kv.getMany(["key1", "key2", "key3"]);
console.log(values); // { key1: "value1", key2: "value2", key3: "value3" }
```

### Using different storage adapters

```typescript
import { BrowserStorage } from "jsr:@dreamer/storage/client";

// localStorage (persistent, across sessions)
const localStorage = new BrowserStorage({
  adapter: "localStorage",
});

// sessionStorage (temporary, current session only)
const sessionStorage = new BrowserStorage({
  adapter: "sessionStorage",
});

// IndexedDB (large-capacity storage)
const indexedDB = new BrowserStorage({
  adapter: "indexedDB",
  dbName: "myApp",
  version: 1,
});

// Usage examples
await localStorage.set("user", userData); // Persistent storage
await sessionStorage.set("temp", tempData); // Temporary storage
await indexedDB.set("largeData", largeData); // Large-capacity storage
```

### Switching storage adapters

```typescript
import { BrowserStorage, StorageAdapter } from "jsr:@dreamer/storage/client";

// Implement a custom adapter
class CustomBrowserAdapter implements StorageAdapter {
  async get(key: string): Promise<any> {
    // Custom read logic
    return JSON.parse(localStorage.getItem(key) || "null");
  }

  async set(key: string, value: any): Promise<void> {
    // Custom write logic
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

## Use cases

- **Local data storage**: User settings, application state
- **Offline data cache**: Offline data storage, data sync
- **Temporary data storage**: Form data, session data
- **Configuration storage**: User preferences, theme settings

## Performance

- **Batch operations**: Batch read/write to reduce I/O
- **Caching**: Built-in LRU cache for faster reads
- **Async operations**: All operations are async and non-blocking
- **Memory management**: Expired data is cleaned up to avoid leaks

---

## 📝 Notes

- **Unified interface**: Same API as server-side storage for consistency
- **Adapter pattern**: Multiple backends, easy to extend
- **Type safety**: Full TypeScript types
- **No external dependencies**: Pure TypeScript implementation

---

## 🤝 Contributing

Issues and Pull Requests are welcome.

---

## 📄 License

Apache License 2.0 — see [LICENSE](../../../LICENSE)

---

<div align="center">

**Made with ❤️ by Dreamer Team**

</div>
