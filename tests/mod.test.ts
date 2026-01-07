/**
 * @fileoverview Storage 测试
 */

import { describe, expect, it } from "jsr:@dreamer/test@^1.0.0-alpha.1";
import { FileStorageAdapter } from "../src/mod.ts";
import { join } from "jsr:@std/path@^1.0.0/join";

describe("Storage", () => {
  describe("FileStorageAdapter", () => {
    const testDir = join(Deno.cwd(), "tests", "output");

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

  });
});
