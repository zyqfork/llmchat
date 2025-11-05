/**
 * 统一的 Fetch 代理模块
 * 
 * 提供针对不同场景的 Tauri 命令：
 * 1. MCP 请求：tauri_fetch_mcp / tauri_fetch_mcp_stream
 * 2. 大模型请求：tauri_fetch_llm / tauri_fetch_llm_stream
 * 3. 云同步请求：tauri_fetch_sync / tauri_fetch_sync_stream
 */

use std::time::Duration;
use std::sync::atomic::{AtomicU32, Ordering};
use std::collections::HashMap;
use futures_util::StreamExt;
use reqwest::Client;
use reqwest::header::{HeaderName, HeaderMap};

static REQUEST_COUNTER: AtomicU32 = AtomicU32::new(0);

// ============================================================================
// 通用响应结构
// ============================================================================

#[derive(Debug, Clone, serde::Serialize)]
pub struct FetchResponse {
    status: u16,
    headers: HashMap<String, String>,
    body: Vec<u8>,
}

// ============================================================================
// 内部辅助函数
// ============================================================================

fn build_header_map(headers: &HashMap<String, String>) -> Result<HeaderMap, String> {
    let mut header_map = HeaderMap::new();
    for (key, value) in headers {
        header_map.insert(
            key.parse::<HeaderName>().map_err(|e| format!("Invalid header name: {}", e))?,
            value.parse().map_err(|e| format!("Invalid header value: {}", e))?,
        );
    }
    Ok(header_map)
}

async fn execute_request(
    log_prefix: &str,
    method: String,
    url: String,
    header_map: HeaderMap,
    body: Vec<u8>,
    timeout: Duration,
) -> Result<FetchResponse, String> {
    println!("[{}] {} {}", log_prefix, method, url);
    println!("[{}] ========== Request Headers ==========", log_prefix);
    for (key, value) in header_map.iter() {
        if let Ok(value_str) = value.to_str() {
            println!("[{}]   {}: {}", log_prefix, key.as_str(), value_str);
        }
    }
    println!("[{}] =========================================", log_prefix);

    // 构建客户端
    let client = Client::builder()
        .default_headers(header_map)
        .redirect(reqwest::redirect::Policy::limited(3))
        .connect_timeout(Duration::new(10, 0))
        .timeout(timeout)
        .build()
        .map_err(|e| format!("Failed to build client: {}", e))?;

    // 解析方法
    let method = method
        .parse::<reqwest::Method>()
        .map_err(|e| format!("Invalid method: {}", e))?;

    // 构建请求
    let mut request = client.request(
        method.clone(),
        url.parse::<reqwest::Url>()
            .map_err(|e| format!("Invalid URL: {}", e))?,
    );

    // 添加请求体
    if method == reqwest::Method::POST
        || method == reqwest::Method::PUT
        || method == reqwest::Method::PATCH
    {
        request = request.body(body);
    }

    // 发送请求
    let response = request
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    // 提取响应头
    let mut resp_headers = HashMap::new();
    for (name, value) in response.headers() {
        resp_headers.insert(
            name.as_str().to_string(),
            std::str::from_utf8(value.as_bytes())
                .unwrap_or("")
                .to_string(),
        );
    }

    // 提取状态码
    let status = response.status().as_u16();

    // 读取响应体
    let body = response
        .bytes()
        .await
        .map_err(|e| format!("Failed to read response body: {}", e))?
        .to_vec();

    Ok(FetchResponse {
        status,
        headers: resp_headers,
        body,
    })
}

// ============================================================================
// MCP 请求（非流式）
// ============================================================================

#[tauri::command]
pub async fn tauri_fetch_mcp(
    method: String,
    url: String,
    headers: HashMap<String, String>,
    body: Vec<u8>,
) -> Result<FetchResponse, String> {
    let mut header_map = build_header_map(&headers)?;
    
    // MCP 请求强制设置 Accept header 为支持 JSON 和 SSE
    header_map.insert(
        "Accept".parse::<HeaderName>().unwrap(),
        "application/json, text/event-stream".parse().unwrap(),
    );

    execute_request("Tauri MCP", method, url, header_map, body, Duration::new(300, 0)).await
}

// ============================================================================
// 大模型请求（非流式）
// ============================================================================

#[tauri::command]
pub async fn tauri_fetch_llm(
    method: String,
    url: String,
    headers: HashMap<String, String>,
    body: Vec<u8>,
) -> Result<FetchResponse, String> {
    let header_map = build_header_map(&headers)?;
    
    // 大模型请求通常需要更长的超时时间
    execute_request("Tauri LLM", method, url, header_map, body, Duration::new(300, 0)).await
}

// ============================================================================
// 云同步请求（非流式）
// ============================================================================

#[tauri::command]
pub async fn tauri_fetch_sync(
    method: String,
    url: String,
    headers: HashMap<String, String>,
    body: Vec<u8>,
) -> Result<FetchResponse, String> {
    let header_map = build_header_map(&headers)?;
    
    // 云同步请求使用标准超时
    execute_request("Tauri Sync", method, url, header_map, body, Duration::new(60, 0)).await
}

// ============================================================================
// 流式请求通用结构
// ============================================================================

#[derive(Debug, Clone, serde::Serialize)]
pub struct StreamResponse {
    request_id: u32,
    status: u16,
    status_text: String,
    headers: HashMap<String, String>,
}

#[derive(Clone, serde::Serialize)]
pub struct ChunkPayload {
    request_id: u32,
    chunk: bytes::Bytes,
}

#[derive(Clone, serde::Serialize)]
pub struct EndPayload {
    request_id: u32,
    status: u16,
}

async fn execute_stream_request(
    log_prefix: &str,
    window: tauri::Window,
    method: String,
    url: String,
    header_map: HeaderMap,
    body: Vec<u8>,
) -> Result<StreamResponse, String> {
    let event_name = "stream-response";
    let request_id = REQUEST_COUNTER.fetch_add(1, Ordering::SeqCst);

    println!("[{}] {} {}", log_prefix, method, url);
    println!("[{}] ========== Request Headers ==========", log_prefix);
    for (key, value) in header_map.iter() {
        if let Ok(value_str) = value.to_str() {
            println!("[{}]   {}: {}", log_prefix, key.as_str(), value_str);
        }
    }
    println!("[{}] =========================================", log_prefix);

    // 构建客户端
    let client = Client::builder()
        .default_headers(header_map)
        .redirect(reqwest::redirect::Policy::limited(3))
        .connect_timeout(Duration::new(10, 0))
        .build()
        .map_err(|e| format!("Failed to build client: {}", e))?;

    // 解析方法
    let method = method
        .parse::<reqwest::Method>()
        .map_err(|e| format!("Invalid method: {}", e))?;

    // 构建请求
    let mut request = client.request(
        method.clone(),
        url.parse::<reqwest::Url>()
            .map_err(|e| format!("Invalid URL: {}", e))?,
    );

    // 添加请求体
    if method == reqwest::Method::POST
        || method == reqwest::Method::PUT
        || method == reqwest::Method::PATCH
    {
        request = request.body(bytes::Bytes::from(body));
    }

    // 发送请求
    let response = request
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    // 提取响应头
    let mut resp_headers = HashMap::new();
    for (name, value) in response.headers() {
        resp_headers.insert(
            name.as_str().to_string(),
            std::str::from_utf8(value.as_bytes())
                .unwrap_or("")
                .to_string(),
        );
    }

    // 提取状态码
    let status = response.status().as_u16();

    // 异步处理流式响应
    let log_prefix_owned = log_prefix.to_string();
    tauri::async_runtime::spawn(async move {
        let mut stream = response.bytes_stream();

        while let Some(chunk) = stream.next().await {
            match chunk {
                Ok(bytes) => {
                    if let Err(e) = window.emit(
                        event_name,
                        ChunkPayload {
                            request_id,
                            chunk: bytes,
                        },
                    ) {
                        println!("[{}] Failed to emit chunk: {:?}", log_prefix_owned, e);
                        break;
                    }
                }
                Err(err) => {
                    println!("[{}] Stream error: {:?}", log_prefix_owned, err);
                    break;
                }
            }
        }

        // 发送结束信号
        if let Err(e) = window.emit(
            event_name,
            EndPayload {
                request_id,
                status: 0,
            },
        ) {
            println!("[{}] Failed to emit end signal: {:?}", log_prefix_owned, e);
        }
    });

    Ok(StreamResponse {
        request_id,
        status,
        status_text: "OK".to_string(),
        headers: resp_headers,
    })
}

// ============================================================================
// MCP 请求（流式）
// ============================================================================

#[tauri::command]
pub async fn tauri_fetch_mcp_stream(
    window: tauri::Window,
    method: String,
    url: String,
    headers: HashMap<String, String>,
    body: Vec<u8>,
) -> Result<StreamResponse, String> {
    let mut header_map = build_header_map(&headers)?;
    
    // MCP 请求强制设置 Accept header 为支持 JSON 和 SSE
    header_map.insert(
        "Accept".parse::<HeaderName>().unwrap(),
        "application/json, text/event-stream".parse().unwrap(),
    );

    execute_stream_request("Tauri MCP Stream", window, method, url, header_map, body).await
}

// ============================================================================
// 大模型请求（流式）
// ============================================================================

#[tauri::command]
pub async fn tauri_fetch_llm_stream(
    window: tauri::Window,
    method: String,
    url: String,
    headers: HashMap<String, String>,
    body: Vec<u8>,
) -> Result<StreamResponse, String> {
    let header_map = build_header_map(&headers)?;
    
    execute_stream_request("Tauri LLM Stream", window, method, url, header_map, body).await
}

// ============================================================================
// 云同步请求（流式）
// ============================================================================

#[tauri::command]
pub async fn tauri_fetch_sync_stream(
    window: tauri::Window,
    method: String,
    url: String,
    headers: HashMap<String, String>,
    body: Vec<u8>,
) -> Result<StreamResponse, String> {
    let header_map = build_header_map(&headers)?;
    
    execute_stream_request("Tauri Sync Stream", window, method, url, header_map, body).await
}
