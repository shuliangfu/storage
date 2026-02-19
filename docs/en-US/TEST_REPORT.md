# 📊 Test Report — @dreamer/storage

## 📋 Overview

| Item                | Details                         |
| ------------------- | ------------------------------- |
| **Package version** | `@dreamer/storage@1.0.0-beta.4` |
| **Service version** | `@dreamer/service@1.0.0-beta.4` |
| **Test date**       | 2026-01-30                      |
| **Test framework**  | `@dreamer/test`                 |
| **Total tests**     | 45                              |
| **Passed**          | 45                              |
| **Failed**          | 0                               |
| **Coverage**        | 100%                            |

## 📁 Test files

| File                | Test count |
| ------------------- | ---------- |
| `tests/mod.test.ts` | 45         |

## ✅ Test case details

### Storage

#### FileStorageAdapter (6 tests)

| Test name                               | Status |
| --------------------------------------- | ------ |
| Should create adapter                   | ✅     |
| Should write and read data              | ✅     |
| Should check if key exists              | ✅     |
| Should delete data                      | ✅     |
| Should list all keys                    | ✅     |
| Should support prefix filter (dir path) | ✅     |

#### FileStorage (10 tests)

| Test name                        | Status |
| -------------------------------- | ------ |
| Should create FileStorage        | ✅     |
| Should write and read string     | ✅     |
| Should write and read object     | ✅     |
| Should write and read Uint8Array | ✅     |
| Should check if file exists      | ✅     |
| Should delete file               | ✅     |
| Should list all files            | ✅     |
| Should create directory          | ✅     |
| Should delete directory          | ✅     |
| Should support custom adapter    | ✅     |

#### KeyValueStorage (11 tests)

| Test name                     | Status |
| ----------------------------- | ------ |
| Should create KeyValueStorage | ✅     |
| Should set and get value      | ✅     |
| Should support object value   | ✅     |
| Should support TTL expiry     | ✅     |
| Should check if key exists    | ✅     |
| Should delete key             | ✅     |
| Should get all keys           | ✅     |
| Should clear all data         | ✅     |
| Should support batch set      | ✅     |
| Should support batch get      | ✅     |
| Should support custom adapter | ✅     |

### StorageManager (9 tests)

| Test name                              | Status |
| -------------------------------------- | ------ |
| Should create StorageManager instance  | ✅     |
| Should get default manager name        | ✅     |
| Should get custom manager name         | ✅     |
| Should get or create file storage      | ✅     |
| Should get or create key-value storage | ✅     |
| Should check if storage exists         | ✅     |
| Should remove storage                  | ✅     |
| Should get all storage names           | ✅     |
| Should clear all storage instances     | ✅     |

### StorageManager ServiceContainer integration (4 tests)

| Test name                                           | Status |
| --------------------------------------------------- | ------ |
| Should set and get service container                | ✅     |
| Should get StorageManager from container            | ✅     |
| Should return undefined when service does not exist | ✅     |
| Should support multiple StorageManager instances    | ✅     |

### createStorageManager factory (5 tests)

| Test name                             | Status |
| ------------------------------------- | ------ |
| Should create StorageManager instance | ✅     |
| Should use default name               | ✅     |
| Should use custom name                | ✅     |
| Should be registerable in container   | ✅     |
| Should support custom path            | ✅     |

## 📈 Coverage

| Module                       | Test count | Status  |
| ---------------------------- | ---------- | ------- |
| FileStorageAdapter           | 6          | ✅ Done |
| FileStorage                  | 10         | ✅ Done |
| KeyValueStorage              | 11         | ✅ Done |
| StorageManager               | 9          | ✅ Done |
| ServiceContainer integration | 4          | ✅ Done |
| createStorageManager factory | 5          | ✅ Done |

## 🎯 Conclusion

- ✅ All 45 tests passed
- ✅ File storage adapter behavior covered
- ✅ File storage behavior covered
- ✅ Key-value storage behavior covered
- ✅ StorageManager behavior covered
- ✅ ServiceContainer integration covered
- ✅ Factory tests covered

---

_Test report last updated: 2026-01-30_
