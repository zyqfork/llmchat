/**
 * 统一的 Fetch 代理模块
 * 
 * 提供两个 Tauri 命令：
 * 1. tauri_fetch - 非流式请求
 * 2. tauri_fetch_stream - 流式请求
 */

use std::time::Duration;
use std::sync::atomic::{AtomicU32, Ordering};
use std::collections::HashMap;
use futures_util::StreamExt;
use reqwest::Client;
use reqwest::header::{HeaderName, HeaderMap};

static REQUEST_COUNTER: AtomicU32 = AtomicU32::new(0);

// ============================================================================
// 非流式请求
// ============================================================================

#[derive(Debug, Clone, serde::Serialize)]
pub struct FetchResponse {
    status: u16,
    headers: HashMap<String, String>,
    body: Vec<u8>,
}

#[tauri::command]
pub async fn tauri_fetch(
    method: String,
    url: String,
    headers: HashMap<String, String>,
    body: Vec<u8>,
) -> Result<FetchResponse, String> {
    println!("[Tauri Fetch] {} {}", method, url);

    // 构建请求头
    let mut header_map = HeaderMap::new();
    for (key, value) in &headers {
        header_map.insert(
            key.parse::<HeaderName>().map_err(|e| format!("Invalid header name: {}", e))?,
            value.parse().map_err(|e| format!("Invalid header value: {}", e))?,
        );
    }

    // 构建客户端
    let client = Client::builder()
        .default_headers(header_map)
        .redirect(reqwest::redirect::Policy::limited(3))
        .connect_timeout(Duration::new(10, 0))
        .timeout(Duration::new(300, 0)) // 5 分钟超时
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
// 流式请求
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

#[tauri::command]
pub async fn tauri_fetch_stream(
    window: tauri::Window,
    method: String,
    url: String,
    headers: HashMap<String, String>,
    body: Vec<u8>,
) -> Result<StreamResponse, String> {
    let event_name = "stream-response";
    let request_id = REQUEST_COUNTER.fetch_add(1, Ordering::SeqCst);

    println!("[Tauri Fetch Stream] {} {}", method, url);

    // 构建请求头
    let mut header_map = HeaderMap::new();
    for (key, value) in &headers {
        header_map.insert(
            key.parse::<HeaderName>().map_err(|e| format!("Invalid header name: {}", e))?,
            value.parse().map_err(|e| format!("Invalid header value: {}", e))?,
        );
    }

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
                        println!("[Tauri Fetch Stream] Failed to emit chunk: {:?}", e);
                        break;
                    }
                }
                Err(err) => {
                    println!("[Tauri Fetch Stream] Stream error: {:?}", err);
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
            println!("[Tauri Fetch Stream] Failed to emit end signal: {:?}", e);
        }
    });

    Ok(StreamResponse {
        request_id,
        status,
        status_text: "OK".to_string(),
        headers: resp_headers,
    })
}
