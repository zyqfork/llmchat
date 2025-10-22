# MCP 服务器开发指南

本指南介绍如何开发和部署与本应用兼容的 MCP 服务器。

## 支持的传输协议

本应用支持两种远程 MCP 传输协议：

1. **SSE (Server-Sent Events)** - 单向流式传输
2. **Streamable HTTP** - 双向流式传输

## 选择传输协议

### 使用 SSE 的场景

- 服务器需要主动推送更新
- 单向数据流足够满足需求
- 需要保持长连接
- 实时通知和事件推送

### 使用 Streamable HTTP 的场景

- 标准的请求-响应模式
- 需要完整的 JSON-RPC 支持
- 双向通信需求
- 更好的负载均衡支持

## 开发 SSE 服务器

### 基本要求

1. **端点**: 提供一个 SSE 端点（通常是 `/sse` 或 `/mcp/sse`）
2. **Content-Type**: 返回 `text/event-stream`
3. **CORS**: 配置正确的 CORS 头
4. **事件格式**: 使用 SSE 格式发送 JSON-RPC 消息

### Node.js 示例

```javascript
import express from 'express';

const app = express();

// 配置 CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
  next();
});

// SSE 端点
app.get('/mcp/sse', (req, res) => {
  // 设置 SSE 头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // 发送初始化消息
  const initMessage = {
    jsonrpc: '2.0',
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {}
      },
      serverInfo: {
        name: 'my-mcp-server',
        version: '1.0.0'
      }
    }
  };
  
  res.write(`data: ${JSON.stringify(initMessage)}\n\n`);

  // 保持连接并定期发送心跳
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30000);

  // 清理
  req.on('close', () => {
    clearInterval(heartbeat);
  });
});

app.listen(3000, () => {
  console.log('SSE MCP Server running on port 3000');
});
```

### Python (FastAPI) 示例

```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import json
import asyncio

app = FastAPI()

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def event_generator():
    # 发送初始化消息
    init_message = {
        "jsonrpc": "2.0",
        "method": "initialize",
        "params": {
            "protocolVersion": "2024-11-05",
            "capabilities": {"tools": {}},
            "serverInfo": {
                "name": "my-mcp-server",
                "version": "1.0.0"
            }
        }
    }
    yield f"data: {json.dumps(init_message)}\n\n"
    
    # 保持连接
    while True:
        await asyncio.sleep(30)
        yield ": heartbeat\n\n"

@app.get("/mcp/sse")
async def sse_endpoint():
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )
```

## 开发 Streamable HTTP 服务器

### 基本要求

1. **端点**: 提供一个 HTTP 端点（通常是 `/mcp`）
2. **Content-Type**: 接受和返回 `application/json`
3. **CORS**: 配置正确的 CORS 头
4. **JSON-RPC**: 实现标准的 JSON-RPC 2.0 协议

### Node.js 示例

```javascript
import express from 'express';

const app = express();
app.use(express.json());

// 配置 CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// 健康检查端点
app.get('/mcp', (req, res) => {
  res.json({
    name: 'my-mcp-server',
    version: '1.0.0',
    status: 'ok'
  });
});

// MCP 请求处理
app.post('/mcp', async (req, res) => {
  const { jsonrpc, id, method, params } = req.body;

  // 验证 JSON-RPC 格式
  if (jsonrpc !== '2.0') {
    return res.status(400).json({
      jsonrpc: '2.0',
      id,
      error: {
        code: -32600,
        message: 'Invalid Request'
      }
    });
  }

  try {
    let result;

    switch (method) {
      case 'initialize':
        result = {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: 'my-mcp-server',
            version: '1.0.0'
          }
        };
        break;

      case 'tools/list':
        result = {
          tools: [
            {
              name: 'example_tool',
              description: 'An example tool',
              inputSchema: {
                type: 'object',
                properties: {
                  input: {
                    type: 'string',
                    description: 'Input parameter'
                  }
                },
                required: ['input']
              }
            }
          ]
        };
        break;

      case 'tools/call':
        const { name, arguments: args } = params;
        // 处理工具调用
        result = {
          content: [
            {
              type: 'text',
              text: `Tool ${name} executed with args: ${JSON.stringify(args)}`
            }
          ]
        };
        break;

      default:
        return res.json({
          jsonrpc: '2.0',
          id,
          error: {
            code: -32601,
            message: 'Method not found'
          }
        });
    }

    res.json({
      jsonrpc: '2.0',
      id,
      result
    });
  } catch (error) {
    res.json({
      jsonrpc: '2.0',
      id,
      error: {
        code: -32603,
        message: 'Internal error',
        data: error.message
      }
    });
  }
});

app.listen(3000, () => {
  console.log('Streamable HTTP MCP Server running on port 3000');
});
```

### Python (FastAPI) 示例

```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any, Optional

app = FastAPI()

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class JSONRPCRequest(BaseModel):
    jsonrpc: str = "2.0"
    id: Optional[Any] = None
    method: str
    params: Optional[dict] = None

class JSONRPCResponse(BaseModel):
    jsonrpc: str = "2.0"
    id: Optional[Any] = None
    result: Optional[Any] = None
    error: Optional[dict] = None

@app.get("/mcp")
async def health_check():
    return {
        "name": "my-mcp-server",
        "version": "1.0.0",
        "status": "ok"
    }

@app.post("/mcp")
async def handle_request(request: JSONRPCRequest):
    if request.jsonrpc != "2.0":
        return JSONRPCResponse(
            id=request.id,
            error={
                "code": -32600,
                "message": "Invalid Request"
            }
        )

    try:
        if request.method == "initialize":
            result = {
                "protocolVersion": "2024-11-05",
                "capabilities": {"tools": {}},
                "serverInfo": {
                    "name": "my-mcp-server",
                    "version": "1.0.0"
                }
            }
        elif request.method == "tools/list":
            result = {
                "tools": [
                    {
                        "name": "example_tool",
                        "description": "An example tool",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "input": {
                                    "type": "string",
                                    "description": "Input parameter"
                                }
                            },
                            "required": ["input"]
                        }
                    }
                ]
            }
        elif request.method == "tools/call":
            name = request.params.get("name")
            arguments = request.params.get("arguments", {})
            result = {
                "content": [
                    {
                        "type": "text",
                        "text": f"Tool {name} executed with args: {arguments}"
                    }
                ]
            }
        else:
            return JSONRPCResponse(
                id=request.id,
                error={
                    "code": -32601,
                    "message": "Method not found"
                }
            )

        return JSONRPCResponse(id=request.id, result=result)

    except Exception as e:
        return JSONRPCResponse(
            id=request.id,
            error={
                "code": -32603,
                "message": "Internal error",
                "data": str(e)
            }
        )
```

## 必须实现的 MCP 方法

### 1. initialize

初始化连接，返回服务器信息和能力。

**请求**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": {
      "name": "nextchat-mcp-client",
      "version": "1.0.0"
    }
  }
}
```

**响应**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": {
      "tools": {}
    },
    "serverInfo": {
      "name": "my-mcp-server",
      "version": "1.0.0"
    }
  }
}
```

### 2. tools/list

列出所有可用的工具。

**请求**:
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/list"
}
```

**响应**:
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "tools": [
      {
        "name": "tool_name",
        "description": "Tool description",
        "inputSchema": {
          "type": "object",
          "properties": {
            "param1": {
              "type": "string",
              "description": "Parameter description"
            }
          },
          "required": ["param1"]
        }
      }
    ]
  }
}
```

### 3. tools/call

调用指定的工具。

**请求**:
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "tool_name",
    "arguments": {
      "param1": "value1"
    }
  }
}
```

**响应**:
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Tool execution result"
      }
    ]
  }
}
```

## 部署建议

### 1. 使用 HTTPS

生产环境必须使用 HTTPS，以确保数据传输安全。

### 2. 配置 CORS

正确配置 CORS 头，允许应用访问你的服务器：

```javascript
res.header('Access-Control-Allow-Origin', 'https://your-app-domain.com');
res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
res.header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
```

### 3. 添加认证

使用 Bearer Token 或其他认证机制保护你的 API：

```javascript
app.use((req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || token !== process.env.API_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});
```

### 4. 错误处理

实现完善的错误处理机制：

```javascript
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    jsonrpc: '2.0',
    id: req.body?.id,
    error: {
      code: -32603,
      message: 'Internal error'
    }
  });
});
```

### 5. 日志记录

记录所有请求和错误，便于调试：

```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

## 测试你的服务器

### 使用 curl 测试

```bash
# 测试健康检查
curl http://localhost:3000/mcp

# 测试 initialize
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}'

# 测试 tools/list
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'
```

### 在应用中测试

1. 打开应用的 MCP Market 页面
2. 点击"添加服务器"
3. 填写服务器信息
4. 点击"添加"进行验证
5. 验证成功后，点击"工具"查看可用工具

## 参考资源

- [MCP 官方规范](https://spec.modelcontextprotocol.io/)
- [MCP SDK 文档](https://github.com/modelcontextprotocol/sdk)
- [SSE 规范](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [JSON-RPC 2.0 规范](https://www.jsonrpc.org/specification)
