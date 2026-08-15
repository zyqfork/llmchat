/**
 * 统一的 Fetch 代理（单命令、流式响应）
 *
 * 请求头与超时由前端传入，后端只负责发请求并以事件流式回传 body。
 */

use std::collections::HashMap;
use std::sync::atomic::{AtomicU32, Ordering};
use std::sync::Mutex;
use std::time::Duration;
use futures_util::StreamExt;
use once_cell::sync::Lazy;
use reqwest::header::{HeaderMap, HeaderName};
use reqwest::Client;
use tauri::Emitter;

static REQUEST_COUNTER: AtomicU32 = AtomicU32::new(0);

/// 进行中的流式任务注册表，用于支持前端 AbortSignal 取消原生请求。
static ACTIVE_STREAMS: Lazy<Mutex<HashMap<u32, tauri::async_runtime::JoinHandle<()>>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

/// 复用全局 reqwest Client：启用连接池/Keep-Alive，避免每次请求都重建 Client。
static CLIENT: Lazy<Client> = Lazy::new(|| {
    Client::builder()
        .redirect(reqwest::redirect::Policy::limited(3))
        .connect_timeout(Duration::new(10, 0))
        .pool_idle_timeout(Duration::new(90, 0))
        .pool_max_idle_per_host(32)
        .build()
        .expect("failed to build global reqwest Client")
});

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
    chunk: Vec<u8>,
}

#[derive(Clone, serde::Serialize)]
pub struct EndPayload {
    request_id: u32,
    status: u16,
    error: Option<String>,
}

fn build_header_map(headers: &HashMap<String, String>) -> Result<HeaderMap, String> {
    let mut header_map = HeaderMap::new();
    for (key, value) in headers {
        header_map.insert(
            key.parse::<HeaderName>()
                .map_err(|e| format!("Invalid header name: {}", e))?,
            value
                .parse()
                .map_err(|e| format!("Invalid header value: {}", e))?,
        );
    }
    Ok(header_map)
}

async fn execute_stream_request(
    window: tauri::WebviewWindow,
    method: String,
    url: String,
    header_map: HeaderMap,
    body: Vec<u8>,
    timeout: Duration,
) -> Result<StreamResponse, String> {
    let event_name = "stream-response";
    let request_id = REQUEST_COUNTER.fetch_add(1, Ordering::SeqCst);

    // 只打印 scheme://host/path，避免 query 中的 token/api key 进入日志
    if let Ok(parsed) = url.parse::<reqwest::Url>() {
        println!(
            "[Tauri Fetch] {} {}://{}{}",
            method,
            parsed.scheme(),
            parsed.host_str().unwrap_or("?"),
            parsed.path()
        );
    } else {
        println!("[Tauri Fetch] {} <invalid url>", method);
    }

    let client = &*CLIENT;

    let method = method
        .parse::<reqwest::Method>()
        .map_err(|e| format!("Invalid method: {}", e))?;

    let mut request = client.request(
        method.clone(),
        url.parse::<reqwest::Url>()
            .map_err(|e| format!("Invalid URL: {}", e))?,
    );

    // 注意：不能把 timeout 挂在 reqwest 请求上——它会对“整个响应体”生效，
    // 长流式响应会被总时长硬断。这里改为仅约束“建立连接 + 收到响应头”，
    // 响应体的停滞由流式任务中的空闲超时控制。
    request = request.headers(header_map);

    if method == reqwest::Method::POST
        || method == reqwest::Method::PUT
        || method == reqwest::Method::PATCH
    {
        request = request.body(bytes::Bytes::from(body));
    }

    let response = tokio::time::timeout(timeout, request.send())
        .await
        .map_err(|_| "Request timeout".to_string())?
        .map_err(|e| format!("Request failed: {}", e))?;

    let mut resp_headers = HashMap::new();
    for (name, value) in response.headers() {
        resp_headers.insert(
            name.as_str().to_string(),
            std::str::from_utf8(value.as_bytes())
                .unwrap_or("")
                .to_string(),
        );
    }

    let status = response.status();
    let status_code = status.as_u16();
    let status_text = status
        .canonical_reason()
        .unwrap_or("Unknown Status")
        .to_string();

    let handle = tauri::async_runtime::spawn(async move {
        let mut stream = response.bytes_stream();
        let mut ended_with_error = false;

        // 空闲超时：每个 chunk 到达后重置计时器，流停滞超过 timeout 才终止
        loop {
            match tokio::time::timeout(timeout, stream.next()).await {
                Ok(Some(Ok(bytes))) => {
                    if let Err(e) = window.emit(
                        event_name,
                        ChunkPayload {
                            request_id,
                            chunk: bytes.to_vec(),
                        },
                    ) {
                        println!("[Tauri Fetch] Failed to emit chunk: {:?}", e);
                        ended_with_error = true;
                        break;
                    }
                }
                Ok(Some(Err(err))) => {
                    println!("[Tauri Fetch] Stream error: {:?}", err);
                    ended_with_error = true;
                    let _ = window.emit(
                        event_name,
                        EndPayload {
                            request_id,
                            status: 0,
                            error: Some(err.to_string()),
                        },
                    );
                    break;
                }
                Ok(None) => break,
                Err(_) => {
                    println!(
                        "[Tauri Fetch] Stream idle timeout for request {}",
                        request_id
                    );
                    ended_with_error = true;
                    let _ = window.emit(
                        event_name,
                        EndPayload {
                            request_id,
                            status: 0,
                            error: Some("Response stream idle timeout".to_string()),
                        },
                    );
                    break;
                }
            }
        }

        if !ended_with_error {
            let _ = window.emit(
                event_name,
                EndPayload {
                    request_id,
                    status: 0,
                    error: None,
                },
            );
        }

        if let Ok(mut streams) = ACTIVE_STREAMS.lock() {
            streams.remove(&request_id);
        }
    });

    if let Ok(mut streams) = ACTIVE_STREAMS.lock() {
        streams.insert(request_id, handle);
    }

    Ok(StreamResponse {
        request_id,
        status: status_code,
        status_text,
        headers: resp_headers,
    })
}

/// 取消一个进行中的流式请求（前端 AbortSignal 触发时调用）。
#[tauri::command]
pub fn tauri_fetch_cancel(request_id: u32) -> Result<(), String> {
    let handle = ACTIVE_STREAMS
        .lock()
        .map_err(|_| "active streams lock poisoned".to_string())?
        .remove(&request_id);
    if let Some(handle) = handle {
        handle.abort();
    }
    Ok(())
}

/// 统一 fetch 命令：method, url, headers, body 由前端传入，timeout_secs 默认 300。
#[tauri::command]
pub async fn tauri_fetch(
    window: tauri::WebviewWindow,
    method: String,
    url: String,
    headers: HashMap<String, String>,
    body: Vec<u8>,
    timeout_secs: Option<u64>,
) -> Result<StreamResponse, String> {
    let header_map = build_header_map(&headers)?;
    let timeout = Duration::new(timeout_secs.unwrap_or(300), 0);
    execute_stream_request(window, method, url, header_map, body, timeout).await
}
