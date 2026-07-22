# Changelog

All notable changes to @dreamer/storage are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

---

## [1.1.0] - 2026-07-23

### Added

- **Node.js compatibility**: Storage abstraction now runs on Node 22+ — the
  package is pure logic with no runtime-specific APIs (no `Deno.*`, no `IS_NODE`
  branch, no i18n locale); file-system operations go through
  `@dreamer/runtime-adapter` v1.2.2 (Node-supported), and service-container
  integration through `@dreamer/service` v1.1.0 (Node-supported). `src/` is
  unchanged.
- **Node.js test infra**: Added `package.json`, `tsconfig.json`, and a 3-platform
  Node CI job (Linux/macOS/Windows, Node 22) driven by
  `tsx --test --test-force-exit tests/*.test.ts`; the same `tests/*.test.ts`
  suite is shared across Deno/Bun/Node.

### Changed

- **Dependencies**: `@dreamer/service` ^1.1.0, `@dreamer/runtime-adapter` ^1.2.2,
  `@dreamer/test` ^1.2.3.
- **CI**: Deno bumped to v2.9; added 9 CI jobs across Deno/Bun/Node (3 platforms
  each).
- **Publish**: `jsr publish` no longer uses `--no-check` (stricter release gate).

### Compatibility

- Deno 2.9+ / Bun 1.3+ / Node.js 22+
- Browser (for `@dreamer/storage/client`)

---

## [1.0.0] - 2026-02-19

### Added

Initial stable release. Unified storage abstraction for server (Deno/Bun) and
client (browser).

#### Server-side (main package `@dreamer/storage`)

- **File storage**
  - `FileStorage`: High-level file storage with `read`, `write`, `delete`,
    `exists`, `list`, `mkdir`, `rmdir`.
  - Support for string, object, and `Uint8Array` payloads; automatic JSON
    serialization/deserialization for objects.
  - Directory creation and deletion (when using `FileStorageAdapter`).
  - Optional base path and custom adapter.
- **File storage adapter**
  - `FileStorageAdapter`: Default adapter backed by the file system
    (`@dreamer/runtime-adapter`); configurable `basePath`.
  - Prefix (directory) filtering in `list` for path-based namespacing.
- **Key-value storage**
  - `KeyValueStorage`: Redis-like key-value API with `get`, `set`, `delete`,
    `has`, `keys`, `clear`.
  - TTL (time-to-live) support; expired entries are ignored on read and can be
    cleaned up.
  - Batch operations: `setMany`, `getMany`.
  - Optional custom adapter (default: `FileStorageAdapter` with a dedicated base
    path).
- **Storage adapter interface**
  - `StorageAdapter`: Unified interface (`get`, `set`, `delete`, `has`, `keys`,
    `clear`) for pluggable backends.
  - `StorageOptions`: Optional `ttl` and extensible options for adapter-specific
    behavior.
- **Storage manager**
  - `StorageManager`: Central manager for multiple `FileStorage` and
    `KeyValueStorage` instances by name.
  - `getFileStorage(name, basePath?)`, `getKVStorage(name, basePath?)`: Get or
    create named instances.
  - `hasFileStorage`, `hasKVStorage`, `removeFileStorage`, `removeKVStorage`,
    `getFileStorageNames`, `getKVStorageNames`, `clear`.
  - Optional `name` for the manager; optional `@dreamer/service` container
    integration via `setContainer` / `getContainer` / `fromContainer`.
  - `createStorageManager(options?)`: Factory for creating and optionally
    registering a `StorageManager` in a service container.

#### Client-side (sub-package `@dreamer/storage/client`)

- **Browser storage**
  - `BrowserStorage`: Unified API over browser storage backends (`localStorage`,
    `sessionStorage`, IndexedDB).
  - Adapter-based: `LocalStorageAdapter`, `SessionStorageAdapter`,
    `IndexedDBAdapter` (with `dbName`, `version`).
  - Methods: `get`, `set`, `delete`, `has`, `keys`, `clear` (async).
- **Browser key-value storage**
  - `KeyValueStorage` (client): Extends browser storage with TTL, batch
    `setMany`/`getMany`, and the same key-value semantics as the server.
- **Browser storage adapter interface**
  - `BrowserStorageAdapter`: Interface for custom browser backends; same method
    set as server `StorageAdapter` (async).
  - `StorageOptions`: Optional `ttl` and extra options.

#### General

- **Exports**: Main entry `jsr:@dreamer/storage` (server); client entry
  `jsr:@dreamer/storage/client` (browser).
- **Documentation**: README (EN/zh-CN), client README (EN/zh-CN), test report
  (EN/zh-CN).
- **Compatibility**: Deno 2.6+, Bun 1.3.5+; client runs in browser environments;
  no extra runtime dependencies beyond `@dreamer/service` (optional) and
  `@dreamer/runtime-adapter`.
- **Error messages**: Server-side errors in English (e.g. "mkdir is only
  supported with FileStorageAdapter", "rmdir is only supported with
  FileStorageAdapter").

### Compatibility

- Deno 2.6+
- Bun 1.3.5+
- Browser (for `@dreamer/storage/client`)
