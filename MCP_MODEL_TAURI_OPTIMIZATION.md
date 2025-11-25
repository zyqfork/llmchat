# MCP、模型管理和 Tauri 优化分析

## 发现的优化机会

### 1. 🔴 MCP 客户端内存管理问题

#### 问题：客户端映射无清理机制

**位置：** `app/mcp/actions.client.ts`

```typescript
// 全局 Map，永不清理
const clientsMap = new Map<string, {
  client: any | null;
  tools: any | null;
  errorMsg: string | null;
}>();
```

**问题：**
- 客户端一旦创建，永远保留在内存中
- 即使服务器被删除，客户端对象仍然存在
- 长时间运行会累积大量无用的客户端对象
- 可能导致内存泄漏

**影响：**
- 内存持续增长
- 性能逐渐下降
- 可能导致应用崩溃

---

### 2. 🟡 模型表重复计算

#### 问题：每次调用都重新计算整个模型表

**位置：** `app/utils/model.ts`

```typescript
export function collectModels(
  models: readonly LLMModel[],
  customModels: string,
) {
  const modelTable = collectModelTable(models, customModels);
  let allModels = Object.values(modelTable);
  allModels = sortModelTable(allModels);
  return allModels;
}
```

**问题：**
- 每次调用都解析 `customModels` 字符串
- 每次都重新构建模型表
- 每次都重新排序
- 没有缓存机制

**影响：**
- 不必要的 CPU 消耗
- 特别是在模型选择器频繁打开时
- 影响用户体验

---

### 3. 🟡 MCP 工具列表重复获取

#### 问题：每次需要工具时都遍历所有客户端

**位置：** `app/mcp/actions.client.ts`

```typescript
export async function getAllTools() {
  const list = [] as any[];
  for (const [clientId, status] of clientsMap.entries()) {
    list.push({ clientId, tools: status.tools });
  }
  return list;
}

export async function getMcpToolsForFunctionCall() {
  // 每次都重新遍历和转换
  const tools: any[] = [];
  for (const [clientId, status] of clientsMap.entries()) {
    // ... 转换逻辑
  }
  return tools;
}
```

**问题：**
- 工具列表很少变化，但每次都重新计算
- 格式转换重复执行
- 没有缓存

**影响：**
- 不必要的计算开销
- 特别是在频繁调用时

---

### 4. 🟢 Tauri Fetch 客户端重复创建

#### 问题：每个请求都创建新的 HTTP 客户端

**位置：** `src-tauri/src/fetch.rs`

```rust
async fn execute_request(...) -> Result<FetchResponse, String> {
    // 每次请求都创建新客户端
    let client = Client::builder()
        .default_headers(header_map)
        .redirect(reqwest::redirect::Policy::limited(3))
        .connect_timeout(Duration::new(10, 0))
        .timeout(timeout)
        .build()
        .map_err(|e| format!("Failed to build client: {}", e))?;
    // ...
}
```

**问题：**
- HTTP 客户端创建有开销
- 无法复用连接池
- 每次都重新建立 TCP 连接

**影响：**
- 增加请求延迟
- 浪费系统资源
- 特别是在频繁请求时

---

### 5. 🟡 LocalStorage 频繁读写

#### 问题：每次操作都读写 localStorage

**位置：** `app/mcp/actions.client.ts`

```typescript
function readConfig(): McpConfigData {
  const raw = localStorage.getItem(LS_KEY);
  // ... 解析
}

function writeConfig(cfg: McpConfigData) {
  localStorage.setItem(LS_KEY, JSON.stringify(cfg));
}

// 每个操作都调用 readConfig 和 writeConfig
export async function addMcpServer(...) {
  const current = readConfig();  // 读取
  // ... 修改
  writeConfig(next);  // 写入
}
```

**问题：**
- localStorage 操作是同步的，会阻塞主线程
- JSON 序列化/反序列化有开销
- 频繁操作影响性能

**影响：**
- UI 可能卡顿
- 特别是在配置频繁变化时

---

## 优化方案

### 优化 1：MCP 客户端生命周期管理 🔴

#### 实施方案

```typescript
// 添加客户端清理机制
export async function cleanupUnusedClients() {
  const cfg = readConfig();
  const validIds = new Set(Object.keys(cfg.mcpServers));
  
  const toRemove: string[] = [];
  for (const [clientId, runtime] of clientsMap.entries()) {
    if (!validIds.has(clientId)) {
      toRemove.push(clientId);
    }
  }
  
  for (const clientId of toRemove) {
    const runtime = clientsMap.get(clientId);
    if (runtime?.client) {
      await removeClient(runtime.client);
    }
    clientsMap.delete(clientId);
  }
  
  if (toRemove.length > 0) {
    logger.info(`Cleaned up ${toRemove.length} unused MCP clients`);
  }
}

// 在删除服务器时立即清理
export async function removeMcpServer(clientId: string): Promise<McpConfigData> {
  const current = readConfig();
  const { [clientId]: _omit, ...rest } = current.mcpServers;
  const next: McpConfigData = { ...current, mcpServers: rest };
  writeConfig(next);
  
  // 立即清理客户端
  const runtime = clientsMap.get(clientId);
  if (runtime?.client) {
    await removeClient(runtime.client);
  }
  clientsMap.delete(clientId);
  
  return next;
}

// 定期清理（在应用初始化时启动）
export function startMcpCleanupTimer() {
  setInterval(() => {
    cleanupUnusedClients();
  }, 10 * 60 * 1000); // 每 10 分钟
}
```

**收益：**
- ✅ 防止内存泄漏
- ✅ 及时释放资源
- ✅ 保持应用健康

---

### 优化 2：模型表缓存 🟡

#### 实施方案

```typescript
// 添加缓存层
const modelTableCache = new Map<string, {
  models: readonly LLMModel[];
  customModels: string;
  defaultModel?: string;
  result: any[];
  timestamp: number;
}>();

const CACHE_TTL = 60 * 1000; // 1 分钟

export function collectModelsWithCache(
  models: readonly LLMModel[],
  customModels: string,
  defaultModel?: string,
) {
  const cacheKey = `${customModels}|${defaultModel || ''}`;
  const cached = modelTableCache.get(cacheKey);
  
  // 检查缓存是否有效
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }
  
  // 计算新结果
  const result = defaultModel
    ? collectModelsWithDefaultModel(models, customModels, defaultModel)
    : collectModels(models, customModels);
  
  // 更新缓存
  modelTableCache.set(cacheKey, {
    models,
    customModels,
    defaultModel,
    result,
    timestamp: Date.now(),
  });
  
  return result;
}

// 清理过期缓存
export function cleanupModelCache() {
  const now = Date.now();
  for (const [key, value] of modelTableCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      modelTableCache.delete(key);
    }
  }
}
```

**收益：**
- ✅ 减少重复计算
- ✅ 提升响应速度
- ✅ 降低 CPU 使用

---

### 优化 3：MCP 工具列表缓存 🟡

#### 实施方案

```typescript
// 添加工具列表缓存
let cachedAllTools: any[] | null = null;
let cachedFunctionCallTools: any[] | null = null;
let toolsCacheVersion = 0;

// 当客户端状态变化时，使缓存失效
function invalidateToolsCache() {
  cachedAllTools = null;
  cachedFunctionCallTools = null;
  toolsCacheVersion++;
}

export async function getAllTools() {
  if (cachedAllTools) {
    return cachedAllTools;
  }
  
  const list = [] as any[];
  for (const [clientId, status] of clientsMap.entries()) {
    list.push({ clientId, tools: status.tools });
  }
  
  cachedAllTools = list;
  return list;
}

export async function getMcpToolsForFunctionCall() {
  if (cachedFunctionCallTools) {
    return cachedFunctionCallTools;
  }
  
  const cfg = readConfig();
  const tools: any[] = [];
  
  for (const [clientId, status] of clientsMap.entries()) {
    if (!status.tools?.tools) continue;
    
    const serverCfg = cfg.mcpServers[clientId];
    if (serverCfg?.status === "paused") continue;
    
    status.tools.tools.forEach((tool: any) => {
      tools.push({
        type: "function",
        function: {
          name: `mcp_${clientId}_${tool.name}`,
          description: tool.description || `Tool ${tool.name} from MCP server ${clientId}`,
          parameters: tool.inputSchema || { type: "object", properties: {} },
        },
        _mcpMeta: { clientId, toolName: tool.name },
      });
    });
  }
  
  cachedFunctionCallTools = tools;
  return tools;
}

// 在客户端初始化/更新时使缓存失效
async function initializeSingleClient(clientId: string, serverConfig: ServerConfig) {
  // ... 原有逻辑
  invalidateToolsCache();
}
```

**收益：**
- ✅ 减少重复计算
- ✅ 提升工具调用性能
- ✅ 降低 CPU 使用

---

### 优化 4：Tauri HTTP 客户端复用 🟢

#### 实施方案

```rust
use once_cell::sync::Lazy;
use std::sync::Mutex;

// 全局 HTTP 客户端池
static CLIENT_POOL: Lazy<Mutex<HashMap<String, Client>>> = Lazy::new(|| {
    Mutex::new(HashMap::new())
});

fn get_or_create_client(
    key: &str,
    timeout: Duration,
) -> Result<Client, String> {
    let mut pool = CLIENT_POOL.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(client) = pool.get(key) {
        return Ok(client.clone());
    }
    
    let client = Client::builder()
        .redirect(reqwest::redirect::Policy::limited(3))
        .connect_timeout(Duration::new(10, 0))
        .timeout(timeout)
        .pool_max_idle_per_host(10)
        .build()
        .map_err(|e| format!("Failed to build client: {}", e))?;
    
    pool.insert(key.to_string(), client.clone());
    Ok(client)
}

async fn execute_request(
    log_prefix: &str,
    method: String,
    url: String,
    header_map: HeaderMap,
    body: Vec<u8>,
    timeout: Duration,
) -> Result<FetchResponse, String> {
    // 使用复用的客户端
    let client_key = format!("{}_{}", log_prefix, timeout.as_secs());
    let client = get_or_create_client(&client_key, timeout)?;
    
    // ... 其余逻辑
}
```

**收益：**
- ✅ 复用 TCP 连接
- ✅ 减少请求延迟
- ✅ 降低系统资源消耗

---

### 优化 5：LocalStorage 缓存层 🟡

#### 实施方案

```typescript
// 添加内存缓存层
let configCache: McpConfigData | null = null;
let configCacheTime = 0;
const CONFIG_CACHE_TTL = 1000; // 1 秒

function readConfig(): McpConfigData {
  // 检查内存缓存
  if (configCache && Date.now() - configCacheTime < CONFIG_CACHE_TTL) {
    return configCache;
  }
  
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) {
      configCache = { ...DEFAULT_MCP_CONFIG };
      configCacheTime = Date.now();
      return configCache;
    }
    
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !("mcpServers" in parsed)) {
      configCache = { ...DEFAULT_MCP_CONFIG };
      configCacheTime = Date.now();
      return configCache;
    }
    
    configCache = parsed as McpConfigData;
    configCacheTime = Date.now();
    return configCache;
  } catch (e) {
    logger.error(`Failed to read local MCP config: ${String(e)}`);
    configCache = { ...DEFAULT_MCP_CONFIG };
    configCacheTime = Date.now();
    return configCache;
  }
}

function writeConfig(cfg: McpConfigData) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(cfg));
    // 更新缓存
    configCache = cfg;
    configCacheTime = Date.now();
  } catch (e) {
    logger.error(`Failed to write local MCP config: ${String(e)}`);
  }
}

// 使缓存失效
function invalidateConfigCache() {
  configCache = null;
  configCacheTime = 0;
}
```

**收益：**
- ✅ 减少 localStorage 访问
- ✅ 降低 JSON 解析开销
- ✅ 提升响应速度

---

## 优先级排序

### 🔴 高优先级（立即实施）

1. **MCP 客户端生命周期管理**
   - 影响：高（内存泄漏）
   - 难度：低
   - 收益：防止内存泄漏

### 🟡 中优先级（近期实施）

2. **模型表缓存**
   - 影响：中（性能）
   - 难度：低
   - 收益：提升响应速度

3. **MCP 工具列表缓存**
   - 影响：中（性能）
   - 难度：低
   - 收益：减少重复计算

4. **LocalStorage 缓存层**
   - 影响：中（性能）
   - 难度：低
   - 收益：减少 I/O 操作

### 🟢 低优先级（可选）

5. **Tauri HTTP 客户端复用**
   - 影响：低（性能）
   - 难度：中
   - 收益：减少连接开销

---

## 总结

发现了 **5 个优化机会**，涵盖：
- 内存管理（1 个）
- 性能优化（4 个）

建议优先实施高优先级优化，可以显著改善应用的稳定性和性能。
