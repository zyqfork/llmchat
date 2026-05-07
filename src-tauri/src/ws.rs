use futures_util::{SinkExt, StreamExt};
use once_cell::sync::Lazy;
use std::collections::HashMap;
use std::sync::atomic::{AtomicU32, Ordering};
use std::sync::Mutex;
use tauri::Emitter;
use tokio::sync::mpsc::{unbounded_channel, UnboundedSender};
use tokio_tungstenite::tungstenite::client::IntoClientRequest;
use tokio_tungstenite::tungstenite::protocol::Message;

static WS_COUNTER: AtomicU32 = AtomicU32::new(1);
static WS_CONNECTIONS: Lazy<Mutex<HashMap<u32, UnboundedSender<Message>>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

#[derive(Clone, serde::Serialize)]
struct WsOpenPayload {
    connection_id: u32,
}

#[derive(Clone, serde::Serialize)]
struct WsMessagePayload {
    connection_id: u32,
    data: String,
}

#[derive(Clone, serde::Serialize)]
struct WsClosePayload {
    connection_id: u32,
    code: Option<u16>,
    reason: Option<String>,
}

#[derive(Clone, serde::Serialize)]
struct WsErrorPayload {
    connection_id: u32,
    error: String,
}

#[tauri::command]
pub async fn tauri_ws_connect(
    window: tauri::WebviewWindow,
    url: String,
    protocols: Vec<String>,
    headers: HashMap<String, String>,
) -> Result<u32, String> {
    // IMPORTANT:
    // - Do NOT build a raw http::Request manually because tungstenite won't auto-inject
    //   mandatory websocket handshake headers (e.g. sec-websocket-key).
    // - Start from IntoClientRequest so tungstenite can generate a proper handshake.
    let mut request = url
        .clone()
        .into_client_request()
        .map_err(|e| format!("invalid ws url/request: {e}"))?;

    let has_authorization = headers.keys().any(|k| k.eq_ignore_ascii_case("authorization"));

    // DashScope realtime：Bearer 鉴权 handshake 成功但服务端常不回送 Sec-WebSocket-Protocol，
    // 客户端若声明了子协议，tungstenite 会严格校验并报 SubProtocol error.
    if !protocols.is_empty() && !has_authorization {
        request
            .headers_mut()
            .insert(
                "Sec-WebSocket-Protocol",
                protocols
                    .join(",")
                    .parse()
                    .map_err(|e| format!("invalid ws protocols header: {e}"))?,
            );
    }

    if !headers.is_empty() {
        for (k, v) in headers {
            // Skip websocket handshake reserved headers (tungstenite will set them)
            let key = k.trim();
            if key.is_empty() {
                continue;
            }
            if let Ok(name) = key.parse::<http::header::HeaderName>() {
                if let Ok(value) = v.parse::<http::header::HeaderValue>() {
                    request.headers_mut().insert(name, value);
                }
            }
        }
    }

    let (ws_stream, _) = tokio_tungstenite::connect_async(request)
        .await
        .map_err(|e| format!("ws connect failed: {e}"))?;

    let connection_id = WS_COUNTER.fetch_add(1, Ordering::SeqCst);
    let (tx, mut rx) = unbounded_channel::<Message>();
    WS_CONNECTIONS
        .lock()
        .map_err(|_| "ws lock poisoned".to_string())?
        .insert(connection_id, tx.clone());

    let tx_in_reader = tx.clone();

    let (mut write, mut read) = ws_stream.split();
    let write_window = window.clone();
    let read_window = window.clone();

    let _ = window.emit(
        "tauri-ws-open",
        WsOpenPayload {
            connection_id,
        },
    );

    tauri::async_runtime::spawn(async move {
        while let Some(message) = rx.recv().await {
            if let Err(err) = write.send(message).await {
                let _ = write_window.emit(
                    "tauri-ws-error",
                    WsErrorPayload {
                        connection_id,
                        error: err.to_string(),
                    },
                );
                break;
            }
        }
    });

    tauri::async_runtime::spawn(async move {
        while let Some(message) = read.next().await {
            match message {
                Ok(Message::Text(text)) => {
                    let _ = read_window.emit(
                        "tauri-ws-message",
                        WsMessagePayload {
                            connection_id,
                            data: text.to_string(),
                        },
                    );
                }
                Ok(Message::Binary(bin)) => {
                    // DashScope 等可能对 JSON 使用 Binary；丢弃会导致前端永远收不到 session.updated
                    let data = String::from_utf8_lossy(&bin).to_string();
                    if !data.is_empty() {
                        let _ = read_window.emit(
                            "tauri-ws-message",
                            WsMessagePayload {
                                connection_id,
                                data,
                            },
                        );
                    }
                }
                Ok(Message::Ping(payload)) => {
                    let _ = tx_in_reader.send(Message::Pong(payload));
                }
                Ok(Message::Close(frame)) => {
                    let payload = WsClosePayload {
                        connection_id,
                        code: frame.as_ref().map(|f| f.code.into()),
                        reason: frame.as_ref().map(|f| f.reason.to_string()),
                    };
                    let _ = read_window.emit("tauri-ws-close", payload);
                    break;
                }
                Ok(_) => {}
                Err(err) => {
                    let _ = read_window.emit(
                        "tauri-ws-error",
                        WsErrorPayload {
                            connection_id,
                            error: err.to_string(),
                        },
                    );
                    break;
                }
            }
        }

        if let Ok(mut map) = WS_CONNECTIONS.lock() {
            map.remove(&connection_id);
        }
    });

    Ok(connection_id)
}

#[tauri::command]
pub async fn tauri_ws_send_text(connection_id: u32, data: String) -> Result<(), String> {
    let sender = WS_CONNECTIONS
        .lock()
        .map_err(|_| "ws lock poisoned".to_string())?
        .get(&connection_id)
        .cloned()
        .ok_or_else(|| format!("ws connection not found: {connection_id}"))?;
    sender
        .send(Message::Text(data.into()))
        .map_err(|e| format!("ws send failed: {e}"))?;
    Ok(())
}

#[tauri::command]
pub async fn tauri_ws_close(connection_id: u32) -> Result<(), String> {
    let sender = WS_CONNECTIONS
        .lock()
        .map_err(|_| "ws lock poisoned".to_string())?
        .remove(&connection_id)
        .ok_or_else(|| format!("ws connection not found: {connection_id}"))?;
    sender
        .send(Message::Close(None))
        .map_err(|e| format!("ws close failed: {e}"))?;
    Ok(())
}
