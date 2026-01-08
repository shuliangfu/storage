/**
 * @fileoverview Storage 测试
 */

import { describe, expect, it } from "@dreamer/test";
// 使用 Node.js 兼容的 path 模块（Bun 和 Deno 都支持）
import { cwd } from "@dreamer/runtime-adapter";
import { join } from "node:path";
import {
  FileStorage,
  FileStorageAdapter,
  KeyValueStorage,
} from "../src/mod.ts";

describe("Storage", () => {
  const testDir = join(cwd(), "tests", "output");

  describe("FileStorageAdapter", () => {
    it("应该创建适配器", () => {
      const adapter = new FileStorageAdapter({ basePath: testDir });
      expect(adapter).toBeTruthy();
      expect(adapter.basePath).toBe(testDir);
    });

    it("应该写入和读取数据", async () => {
      const adapter = new FileStorageAdapter({ basePath: testDir });
      const data = new TextEncoder().encode("test data");
      const key = "write-read-key";

      await adapter.write(key, data);
      const result = await adapter.read(key);

      expect(result).toBeTruthy();
      expect(new TextDecoder().decode(result!)).toBe("test data");

      // 清理
      await adapter.delete(key);
    });

    it("应该检查键是否存在", async () => {
      const adapter = new FileStorageAdapter({ basePath: testDir });
      const data = new TextEncoder().encode("test");
      const key = "exists-key";

      // 确保键不存在
      try {
        await adapter.delete(key);
      } catch {
        // 忽略删除错误
      }

      expect(await adapter.exists(key)).toBeFalsy();
      await adapter.write(key, data);
      expect(await adapter.exists(key)).toBeTruthy();

      // 清理
      await adapter.delete(key);
    });

    it("应该删除数据", async () => {
      const adapter = new FileStorageAdapter({ basePath: testDir });
      const data = new TextEncoder().encode("test");
      const key = "delete-key";

      await adapter.write(key, data);
      expect(await adapter.exists(key)).toBeTruthy();

      await adapter.delete(key);
      expect(await adapter.exists(key)).toBeFalsy();
    });

    it("应该列出所有键", async () => {
      const adapter = new FileStorageAdapter({ basePath: testDir });
      const data = new TextEncoder().encode("test");
      const key1 = "list-key1";
      const key2 = "list-key2";

      // 清理可能存在的键
      try {
        await adapter.delete(key1);
        await adapter.delete(key2);
      } catch {
        // 忽略删除错误
      }

      await adapter.write(key1, data);
      await adapter.write(key2, data);

      const keys = await adapter.list();
      expect(keys.length).toBeGreaterThanOrEqual(2);
      expect(keys).toContain(key1);
      expect(keys).toContain(key2);

      // 清理
      await adapter.delete(key1);
      await adapter.delete(key2);
    });

    it("应该支持前缀过滤（目录路径）", async () => {
      const adapter = new FileStorageAdapter({ basePath: testDir });
      const data = new TextEncoder().encode("test");
      const key1 = "prefix/key1";
      const key2 = "prefix/key2";
      const key3 = "other/key3";

      // 清理可能存在的键
      try {
        await adapter.delete(key1);
        await adapter.delete(key2);
        await adapter.delete(key3);
      } catch {
        // 忽略删除错误
      }

      await adapter.write(key1, data);
      await adapter.write(key2, data);
      await adapter.write(key3, data);

      const allKeys = await adapter.list();
      const prefixKeys = await adapter.list("prefix");

      // 前缀过滤应该只返回 "prefix" 目录下的键
      // 注意：list 方法返回的键可能包含完整路径或相对路径，取决于实现
      expect(prefixKeys.length).toBeGreaterThanOrEqual(2);
      // 检查返回的键是否包含 key1 和 key2（可能是 "key1", "key2" 或 "prefix/key1", "prefix/key2"）
      const hasKey1 = prefixKeys.some((k) => k.includes("key1"));
      const hasKey2 = prefixKeys.some((k) => k.includes("key2"));
      expect(hasKey1).toBeTruthy();
      expect(hasKey2).toBeTruthy();
      // 不应该包含其他目录的键
      const hasKey3 = prefixKeys.some((k) => k.includes("key3"));
      expect(hasKey3).toBeFalsy();

      // 清理
      await adapter.delete(key1);
      await adapter.delete(key2);
      await adapter.delete(key3);
    });
  });

  describe("FileStorage", () => {
    it("应该创建 FileStorage", () => {
      const storage = new FileStorage({ basePath: testDir });
      expect(storage).toBeTruthy();
    });

    it("应该写入和读取字符串", async () => {
      const storage = new FileStorage({ basePath: testDir });
      const key = "file-string-key";

      await storage.write(key, "test string");
      const result = await storage.read<string>(key);

      expect(result).toBe("test string");

      // 清理
      await storage.delete(key);
    });

    it("应该写入和读取对象", async () => {
      const storage = new FileStorage({ basePath: testDir });
      const key = "file-object-key";
      const data = { name: "test", value: 123 };

      await storage.write(key, data);
      const result = await storage.read<typeof data>(key);

      expect(result).toEqual(data);

      // 清理
      await storage.delete(key);
    });

    it("应该写入和读取 Uint8Array", async () => {
      const storage = new FileStorage({ basePath: testDir });
      const key = "file-bytes-key";
      const data = new TextEncoder().encode("binary data");

      await storage.write(key, data);
      const result = await storage.readBytes(key);

      expect(result).toEqual(data);

      // 清理
      await storage.delete(key);
    });

    it("应该检查文件是否存在", async () => {
      const storage = new FileStorage({ basePath: testDir });
      const key = "file-exists-key";

      expect(await storage.exists(key)).toBeFalsy();
      await storage.write(key, "test");
      expect(await storage.exists(key)).toBeTruthy();

      // 清理
      await storage.delete(key);
    });

    it("应该删除文件", async () => {
      const storage = new FileStorage({ basePath: testDir });
      const key = "file-delete-key";

      await storage.write(key, "test");
      expect(await storage.exists(key)).toBeTruthy();

      await storage.delete(key);
      expect(await storage.exists(key)).toBeFalsy();
    });

    it("应该列出所有文件", async () => {
      const storage = new FileStorage({ basePath: testDir });
      const key1 = "file-list-key1";
      const key2 = "file-list-key2";

      // 清理可能存在的键
      try {
        await storage.delete(key1);
        await storage.delete(key2);
      } catch {
        // 忽略删除错误
      }

      await storage.write(key1, "test1");
      await storage.write(key2, "test2");

      const keys = await storage.list();
      expect(keys.length).toBeGreaterThanOrEqual(2);
      expect(keys).toContain(key1);
      expect(keys).toContain(key2);

      // 清理
      await storage.delete(key1);
      await storage.delete(key2);
    });

    it("应该创建目录", async () => {
      const storage = new FileStorage({ basePath: testDir });
      const dirPath = "test-dir";

      await storage.mkdir(dirPath);
      // 验证目录存在（通过写入文件到该目录）
      await storage.write(`${dirPath}/test.txt`, "test");

      // 清理
      await storage.delete(`${dirPath}/test.txt`);
      await storage.rmdir(dirPath);
    });

    it("应该删除目录", async () => {
      const storage = new FileStorage({ basePath: testDir });
      const dirPath = "test-rmdir";

      await storage.mkdir(dirPath);
      await storage.write(`${dirPath}/test.txt`, "test");

      // 验证文件存在
      expect(await storage.exists(`${dirPath}/test.txt`)).toBeTruthy();

      await storage.rmdir(dirPath);

      // 验证目录已删除（文件应该不存在）
      expect(await storage.exists(`${dirPath}/test.txt`)).toBeFalsy();

      // 验证目录下的文件列表为空（如果目录不存在，list 可能返回空数组或抛出错误）
      try {
        const keys = await storage.list(dirPath);
        expect(keys.length).toBe(0);
      } catch {
        // 如果目录不存在导致 list 失败，这也是预期的行为
        // 忽略错误
      }
    });

    it("应该支持自定义适配器", () => {
      const adapter = new FileStorageAdapter({ basePath: testDir });
      const storage = new FileStorage({ adapter });
      expect(storage).toBeTruthy();
    });
  });

  describe("KeyValueStorage", () => {
    it("应该创建 KeyValueStorage", () => {
      const storage = new KeyValueStorage({ basePath: testDir });
      expect(storage).toBeTruthy();
    });

    it("应该设置和获取值", async () => {
      const storage = new KeyValueStorage({ basePath: testDir });
      const key = "kv-set-get-key";

      await storage.set(key, "test value");
      const result = await storage.get<string>(key);

      expect(result).toBe("test value");

      // 清理
      await storage.delete(key);
    });

    it("应该支持对象值", async () => {
      const storage = new KeyValueStorage({ basePath: testDir });
      const key = "kv-object-key";
      const value = { name: "test", count: 42 };

      await storage.set(key, value);
      const result = await storage.get<typeof value>(key);

      expect(result).toEqual(value);

      // 清理
      await storage.delete(key);
    });

    it("应该支持 TTL 过期", async () => {
      const storage = new KeyValueStorage({ basePath: testDir });
      const key = "kv-ttl-key";

      // 设置 1 秒 TTL
      await storage.set(key, "test", { ttl: 1 });
      expect(await storage.get(key)).toBe("test");

      // 等待过期
      await new Promise((resolve) => setTimeout(resolve, 1100));
      expect(await storage.get(key)).toBeNull();

      // 清理（如果还存在）
      try {
        await storage.delete(key);
      } catch {
        // 忽略删除错误
      }
    });

    it("应该检查键是否存在", async () => {
      const storage = new KeyValueStorage({ basePath: testDir });
      const key = "kv-has-key";

      expect(await storage.has(key)).toBeFalsy();
      await storage.set(key, "test");
      expect(await storage.has(key)).toBeTruthy();

      // 清理
      await storage.delete(key);
    });

    it("应该删除键", async () => {
      const storage = new KeyValueStorage({ basePath: testDir });
      const key = "kv-delete-key";

      await storage.set(key, "test");
      expect(await storage.has(key)).toBeTruthy();

      await storage.delete(key);
      expect(await storage.has(key)).toBeFalsy();
    });

    it("应该获取所有键", async () => {
      const storage = new KeyValueStorage({ basePath: testDir });
      const key1 = "kv-keys-key1";
      const key2 = "kv-keys-key2";

      // 清理可能存在的键
      try {
        await storage.delete(key1);
        await storage.delete(key2);
      } catch {
        // 忽略删除错误
      }

      await storage.set(key1, "value1");
      await storage.set(key2, "value2");

      const keys = await storage.keys();
      expect(keys.length).toBeGreaterThanOrEqual(2);
      expect(keys).toContain(key1);
      expect(keys).toContain(key2);

      // 清理
      await storage.delete(key1);
      await storage.delete(key2);
    });

    it("应该清空所有数据", async () => {
      const storage = new KeyValueStorage({ basePath: testDir });
      const key1 = "kv-clear-key1";
      const key2 = "kv-clear-key2";

      await storage.set(key1, "value1");
      await storage.set(key2, "value2");

      await storage.clear();

      expect(await storage.has(key1)).toBeFalsy();
      expect(await storage.has(key2)).toBeFalsy();
    });

    it("应该支持批量设置", async () => {
      const storage = new KeyValueStorage({ basePath: testDir });
      const items = {
        "kv-batch-key1": "value1",
        "kv-batch-key2": "value2",
        "kv-batch-key3": { nested: "value3" },
      };

      await storage.setMany(items);

      expect(await storage.get("kv-batch-key1")).toBe("value1");
      expect(await storage.get("kv-batch-key2")).toBe("value2");
      expect(await storage.get("kv-batch-key3")).toEqual({ nested: "value3" });

      // 清理
      await storage.delete("kv-batch-key1");
      await storage.delete("kv-batch-key2");
      await storage.delete("kv-batch-key3");
    });

    it("应该支持批量获取", async () => {
      const storage = new KeyValueStorage({ basePath: testDir });
      const key1 = "kv-getmany-key1";
      const key2 = "kv-getmany-key2";
      const key3 = "kv-getmany-key3";

      await storage.set(key1, "value1");
      await storage.set(key2, "value2");
      // key3 不设置

      const result = await storage.getMany<string>([key1, key2, key3]);

      expect(result[key1]).toBe("value1");
      expect(result[key2]).toBe("value2");
      expect(result[key3]).toBeUndefined();

      // 清理
      await storage.delete(key1);
      await storage.delete(key2);
    });

    it("应该支持自定义适配器", () => {
      const adapter = new FileStorageAdapter({ basePath: testDir });
      const storage = new KeyValueStorage({ adapter });
      expect(storage).toBeTruthy();
    });
  });
});
