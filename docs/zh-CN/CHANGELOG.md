# 变更日志

@dreamer/storage 的所有重要变更均记录于此。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [1.0.0] - 2026-02-19

### 新增

首个稳定版本。为服务端（Deno/Bun）与客户端（浏览器）提供统一的存储抽象。

#### 服务端（主包 `@dreamer/storage`）

- **文件存储**
  - `FileStorage`：高层文件存储，提供
    `read`、`write`、`delete`、`exists`、`list`、`mkdir`、`rmdir`。
  - 支持字符串、对象与 `Uint8Array`；对象自动 JSON 序列化/反序列化。
  - 目录创建与删除（在使用 `FileStorageAdapter` 时）。
  - 可配置 base 路径与自定义适配器。
- **文件存储适配器**
  - `FileStorageAdapter`：基于文件系统（`@dreamer/runtime-adapter`）的默认适配器，可配置
    `basePath`。
  - `list` 支持前缀（目录路径）过滤，便于按路径划分命名空间。
- **键值存储**
  - `KeyValueStorage`：类 Redis 的键值
    API：`get`、`set`、`delete`、`has`、`keys`、`clear`。
  - 支持 TTL（过期时间）；过期项在读取时被忽略并可被清理。
  - 批量操作：`setMany`、`getMany`。
  - 可选用自定义适配器（默认为带独立 base 路径的 `FileStorageAdapter`）。
- **存储适配器接口**
  - `StorageAdapter`：统一接口（`get`、`set`、`delete`、`has`、`keys`、`clear`），便于接入不同后端。
  - `StorageOptions`：可选 `ttl` 及扩展字段，供适配器自定义行为。
- **存储管理器**
  - `StorageManager`：按名称管理多个 `FileStorage` 与 `KeyValueStorage` 实例。
  - `getFileStorage(name, basePath?)`、`getKVStorage(name, basePath?)`：获取或创建命名实例。
  - `hasFileStorage`、`hasKVStorage`、`removeFileStorage`、`removeKVStorage`、`getFileStorageNames`、`getKVStorageNames`、`clear`。
  - 可选 `name`；可通过 `setContainer` / `getContainer` / `fromContainer` 与
    `@dreamer/service` 容器集成。
  - `createStorageManager(options?)`：工厂函数，用于创建并可选地在服务容器中注册
    `StorageManager`。

#### 客户端（子包 `@dreamer/storage/client`）

- **浏览器存储**
  - `BrowserStorage`：基于 localStorage、sessionStorage、IndexedDB 的统一 API。
  - 适配器：`LocalStorageAdapter`、`SessionStorageAdapter`、`IndexedDBAdapter`（可配置
    `dbName`、`version`）。
  - 方法：`get`、`set`、`delete`、`has`、`keys`、`clear`（异步）。
- **浏览器键值存储**
  - `KeyValueStorage`（客户端）：在浏览器存储之上支持 TTL、批量
    `setMany`/`getMany`，与服务端键值语义一致。
- **浏览器存储适配器接口**
  - `BrowserStorageAdapter`：自定义浏览器后端的接口，方法集与服务端
    `StorageAdapter` 一致（异步）。
  - `StorageOptions`：可选 `ttl` 及其他选项。

#### 通用

- **导出**：主入口 `jsr:@dreamer/storage`（服务端）；客户端入口
  `jsr:@dreamer/storage/client`（浏览器）。
- **文档**：README（英文/中文）、客户端
  README（英文/中文）、测试报告（英文/中文）。
- **兼容性**：Deno 2.6+、Bun 1.3.5+；客户端适用于浏览器环境；除可选的
  `@dreamer/service` 与 `@dreamer/runtime-adapter` 外无额外运行时依赖。
- **错误信息**：服务端错误文案为英文（如 "mkdir is only supported with
  FileStorageAdapter"、"rmdir is only supported with FileStorageAdapter"）。

### 兼容性

- Deno 2.6+
- Bun 1.3.5+
- 浏览器（用于 `@dreamer/storage/client`）
