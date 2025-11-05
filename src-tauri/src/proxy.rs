use std::collections::HashMap;
use std::convert::Infallible;
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::sync::Mutex;
use warp::{Filter, Reply};
use reqwest::Client;
use bytes::Bytes;

#[derive(Clone)]
pub struct ProxyServer {
    port: u16,
    client: Client,
}

impl ProxyServer {
    pub fn new(port: u16) -> Self {
        let client = Client::builder()
            .redirect(reqwest::redirect::Policy::limited(3))
            .timeout(std::time::Duration::from_secs(60))
            .connect_timeout(std::time::Duration::from_secs(10))
            // For development: accept invalid certificates
            // TODO: Remove this in production or make it configurable
            .danger_accept_invalid_certs(true)
            .build()
            .unwrap_or_else(|_| Client::new());

        ProxyServer { port, client }
    }

    pub async fn start(self) -> Result<(), Box<dyn std::error::Error>> {
        let addr: SocketAddr = ([127, 0, 0, 1], self.port).into();
        
        let proxy_server = Arc::new(Mutex::new(self));
        
        // OpenAI proxy route
        let openai_route = warp::path!("api" / "openai" / ..)
            .and(warp::method())
            .and(warp::path::full())
            .and(warp::query::<HashMap<String, String>>())
            .and(warp::header::headers_cloned())
            .and(warp::body::bytes())
            .and(with_proxy(proxy_server.clone()))
            .and_then(handle_proxy_request);

        // Azure proxy route
        let azure_route = warp::path!("api" / "azure" / ..)
            .and(warp::method())
            .and(warp::path::full())
            .and(warp::query::<HashMap<String, String>>())
            .and(warp::header::headers_cloned())
            .and(warp::body::bytes())
            .and(with_proxy(proxy_server.clone()))
            .and_then(handle_proxy_request);

        // Google proxy route
        let google_route = warp::path!("api" / "google" / ..)
            .and(warp::method())
            .and(warp::path::full())
            .and(warp::query::<HashMap<String, String>>())
            .and(warp::header::headers_cloned())
            .and(warp::body::bytes())
            .and(with_proxy(proxy_server.clone()))
            .and_then(handle_proxy_request);

        // Anthropic proxy route
        let anthropic_route = warp::path!("api" / "anthropic" / ..)
            .and(warp::method())
            .and(warp::path::full())
            .and(warp::query::<HashMap<String, String>>())
            .and(warp::header::headers_cloned())
            .and(warp::body::bytes())
            .and(with_proxy(proxy_server.clone()))
            .and_then(handle_proxy_request);

        // Alibaba proxy route
        let alibaba_route = warp::path!("api" / "alibaba" / ..)
            .and(warp::method())
            .and(warp::path::full())
            .and(warp::query::<HashMap<String, String>>())
            .and(warp::header::headers_cloned())
            .and(warp::body::bytes())
            .and(with_proxy(proxy_server.clone()))
            .and_then(handle_proxy_request);

        // MCP proxy route
        let mcp_route = warp::path!("api" / "mcp-proxy" / ..)
            .and(warp::method())
            .and(warp::path::full())
            .and(warp::query::<HashMap<String, String>>())
            .and(warp::header::headers_cloned())
            .and(warp::body::bytes())
            .and(with_proxy(proxy_server.clone()))
            .and_then(handle_proxy_request);

        // Generic proxy route
        let generic_route = warp::path!("api" / "proxy" / ..)
            .and(warp::method())
            .and(warp::path::full())
            .and(warp::query::<HashMap<String, String>>())
            .and(warp::header::headers_cloned())
            .and(warp::body::bytes())
            .and(with_proxy(proxy_server.clone()))
            .and_then(handle_proxy_request);

        // CORS configuration - allow all origins, methods, and headers
        let cors = warp::cors()
            .allow_any_origin()
            .allow_methods(vec!["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"])
            .allow_headers(vec![
                "content-type",
                "authorization",
                "accept",
                "origin",
                "user-agent",
                "cache-control",
                "x-requested-with",
            ])
            .expose_headers(vec![
                "content-type",
                "content-length",
                "cache-control",
                "x-accel-buffering",
            ])
            .max_age(3600);

        let routes = openai_route
            .or(azure_route)
            .or(google_route)
            .or(anthropic_route)
            .or(alibaba_route)
            .or(mcp_route)
            .or(generic_route)
            .with(cors);

        println!("[Tauri Proxy] Starting proxy server on {}", addr);
        warp::serve(routes).run(addr).await;
        
        Ok(())
    }
}

fn with_proxy(
    proxy: Arc<Mutex<ProxyServer>>,
) -> impl Filter<Extract = (Arc<Mutex<ProxyServer>>,), Error = Infallible> + Clone {
    warp::any().map(move || proxy.clone())
}

async fn handle_proxy_request(
    method: warp::http::Method,
    path: warp::path::FullPath,
    query_params: HashMap<String, String>,
    headers: warp::http::HeaderMap,
    body: Bytes,
    proxy: Arc<Mutex<ProxyServer>>,
) -> Result<warp::http::Response<warp::hyper::Body>, Infallible> {
    // Handle OPTIONS preflight requests FIRST (before any other processing)
    if method == warp::http::Method::OPTIONS {
        println!("[Tauri Proxy] Handling OPTIONS preflight request");
        return Ok(warp::http::Response::builder()
            .status(warp::http::StatusCode::NO_CONTENT)
            .header("Access-Control-Allow-Origin", "*")
            .header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD")
            .header("Access-Control-Allow-Headers", "content-type, authorization, accept, origin, user-agent, cache-control, x-requested-with")
            .header("Access-Control-Max-Age", "3600")
            .body(warp::hyper::Body::empty())
            .unwrap());
    }
    
    let proxy = proxy.lock().await;
    
    // Get endpoint from query params
    let endpoint = match query_params.get("endpoint") {
        Some(ep) => ep.clone(),
        None => {
            let json_body = serde_json::to_string(&serde_json::json!({
                "error": "Missing endpoint parameter"
            })).unwrap_or_else(|_| "{}".to_string());
            
            return Ok(warp::http::Response::builder()
                .status(warp::http::StatusCode::BAD_REQUEST)
                .header("content-type", "application/json")
                .header("Access-Control-Allow-Origin", "*")
                .body(warp::hyper::Body::from(json_body))
                .unwrap());
        }
    };

    // Build target URL
    // The endpoint parameter already contains the full URL with query params
    // We should not add additional query params from the proxy request
    let target_url = endpoint.clone();

    println!("[Tauri Proxy] {} {}", method, target_url);
    println!("[Tauri Proxy] Request headers: {:?}", headers.keys().collect::<Vec<_>>());

    // Build request headers
    let mut req_headers = reqwest::header::HeaderMap::new();
    let skip_headers = ["connection", "host", "origin", "referer", "cookie", "accept-encoding"];
    
    for (key, value) in headers.iter() {
        let key_str = key.as_str().to_lowercase();
        if !skip_headers.contains(&key_str.as_str()) 
            && !key_str.starts_with("x-") 
            && !key_str.starts_with("sec-") {
            if let Ok(header_name) = reqwest::header::HeaderName::from_bytes(key.as_str().as_bytes()) {
                if let Ok(header_value) = reqwest::header::HeaderValue::from_bytes(value.as_bytes()) {
                    req_headers.insert(header_name, header_value);
                }
            }
        }
    }

    // Make request
    let req_method = match method.as_str() {
        "GET" => reqwest::Method::GET,
        "POST" => reqwest::Method::POST,
        "PUT" => reqwest::Method::PUT,
        "DELETE" => reqwest::Method::DELETE,
        "PATCH" => reqwest::Method::PATCH,
        "HEAD" => reqwest::Method::HEAD,
        _ => reqwest::Method::GET,
    };

    let mut request = proxy.client
        .request(req_method, &target_url)
        .headers(req_headers);

    if !body.is_empty() {
        request = request.body(body);
    }

    match request.send().await {
        Ok(response) => {
            let status = response.status();
            let mut resp_headers = warp::http::HeaderMap::new();
            
            // Copy response headers (preserve important headers like content-type)
            for (key, value) in response.headers().iter() {
                let key_str = key.as_str().to_lowercase();
                // Skip only problematic headers, but keep content-type, content-length, etc.
                if key_str != "www-authenticate" && key_str != "content-encoding" {
                    if let Ok(header_value) = warp::http::HeaderValue::from_bytes(value.as_bytes()) {
                        resp_headers.insert(key.clone(), header_value);
                    }
                }
            }
            
            // Add CORS headers (comprehensive)
            resp_headers.insert(
                warp::http::header::ACCESS_CONTROL_ALLOW_ORIGIN,
                warp::http::HeaderValue::from_static("*"),
            );
            resp_headers.insert(
                warp::http::header::ACCESS_CONTROL_ALLOW_METHODS,
                warp::http::HeaderValue::from_static("GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD"),
            );
            resp_headers.insert(
                warp::http::header::ACCESS_CONTROL_ALLOW_HEADERS,
                warp::http::HeaderValue::from_static("content-type, authorization, accept, origin, user-agent, cache-control, x-requested-with"),
            );
            resp_headers.insert(
                warp::http::header::ACCESS_CONTROL_EXPOSE_HEADERS,
                warp::http::HeaderValue::from_static("content-type, content-length, cache-control, x-accel-buffering"),
            );
            resp_headers.insert(
                warp::http::header::ACCESS_CONTROL_MAX_AGE,
                warp::http::HeaderValue::from_static("3600"),
            );
            resp_headers.insert(
                "X-Accel-Buffering",
                warp::http::HeaderValue::from_static("no"),
            );

            // Get response body
            match response.bytes().await {
                Ok(body) => {
                    let mut resp = warp::http::Response::builder()
                        .status(status);
                    
                    // Add all headers
                    for (key, value) in resp_headers.iter() {
                        resp = resp.header(key, value);
                    }
                    
                    Ok(resp.body(warp::hyper::Body::from(body)).unwrap())
                }
                Err(e) => {
                    println!("[Tauri Proxy] Failed to read response body: {}", e);
                    let json_body = serde_json::to_string(&serde_json::json!({
                        "error": "Failed to read response body",
                        "message": e.to_string()
                    })).unwrap_or_else(|_| "{}".to_string());
                    
                    Ok(warp::http::Response::builder()
                        .status(warp::http::StatusCode::BAD_GATEWAY)
                        .header("content-type", "application/json")
                        .body(warp::hyper::Body::from(json_body))
                        .unwrap())
                }
            }
        }
        Err(e) => {
            println!("[Tauri Proxy] Request failed: {}", e);
            println!("[Tauri Proxy] Error details: {:?}", e);
            println!("[Tauri Proxy] Target URL was: {}", target_url);
            
            let error_message = if e.is_timeout() {
                "Request timeout"
            } else if e.is_connect() {
                "Connection failed"
            } else if e.is_request() {
                "Invalid request"
            } else {
                "Unknown error"
            };
            
            let json_body = serde_json::to_string(&serde_json::json!({
                "error": "Proxy request failed",
                "message": e.to_string(),
                "errorType": error_message,
                "targetUrl": target_url
            })).unwrap_or_else(|_| "{}".to_string());
            
            Ok(warp::http::Response::builder()
                .status(warp::http::StatusCode::BAD_GATEWAY)
                .header("content-type", "application/json")
                .header("Access-Control-Allow-Origin", "*")
                .body(warp::hyper::Body::from(json_body))
                .unwrap())
        }
    }
}
