/**
 * 统一的 Fetch 代理（单命令、流式响应）
 *
 * 请求头与超时由前端传入，后端只负责发请求并以事件流式回传 body。
 */

use std::time::Duration;
use std::sync::atomic::{AtomicU32, Ordering};
use std::collections::HashMap;
use futures_util::StreamExt;
use reqwest::Client;
use reqwest::header::{HeaderName, HeaderMap};
use tauri::Emitter;

static REQUEST_COUNTER: AtomicU32 = AtomicU32::new(0);

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
}

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

    println!("[Tauri Fetch] {} {}", method, url);

    let client = Client::builder()
        .default_headers(header_map)
        .redirect(reqwest::redirect::Policy::limited(3))
        .connect_timeout(Duration::new(10, 0))
        .timeout(timeout)
        .build()
        .map_err(|e| format!("Failed to build client: {}", e))?;

    let method = method
        .parse::<reqwest::Method>()
        .map_err(|e| format!("Invalid method: {}", e))?;

    let mut request = client.request(
        method.clone(),
        url.parse::<reqwest::Url>()
            .map_err(|e| format!("Invalid URL: {}", e))?,
    );

    if method == reqwest::Method::POST
        || method == reqwest::Method::PUT
        || method == reqwest::Method::PATCH
    {
        request = request.body(bytes::Bytes::from(body));
    }

    let response = request
        .send()
        .await
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

    let status = response.status().as_u16();

    tauri::async_runtime::spawn(async move {
        let mut stream = response.bytes_stream();

        while let Some(chunk) = stream.next().await {
            match chunk {
                Ok(bytes) => {
                    if let Err(e) = window.emit(
                        event_name,
                        ChunkPayload {
                            request_id,
                            chunk: bytes.to_vec(),
                        },
                    ) {
                        println!("[Tauri Fetch] Failed to emit chunk: {:?}", e);
                        break;
                    }
                }
                Err(err) => {
                    println!("[Tauri Fetch] Stream error: {:?}", err);
                    break;
                }
            }
        }

        if let Err(e) = window.emit(
            event_name,
            EndPayload {
                request_id,
                status: 0,
            },
        ) {
            println!("[Tauri Fetch] Failed to emit end: {:?}", e);
        }
    });

    Ok(StreamResponse {
        request_id,
        status,
        status_text: "OK".to_string(),
        headers: resp_headers,
    })
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
