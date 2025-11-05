use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize)]
pub struct ProxyRequest {
    pub method: String,
    pub url: String,
    pub headers: HashMap<String, String>,
    pub body: Option<Vec<u8>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProxyResponse {
    pub status: u16,
    pub headers: HashMap<String, String>,
    pub body: Vec<u8>,
}

#[tauri::command]
pub async fn proxy_fetch(request: ProxyRequest) -> Result<ProxyResponse, String> {
    println!("[Tauri Proxy Command] {} {}", request.method, request.url);
    
    let client = reqwest::Client::builder()
        .redirect(reqwest::redirect::Policy::limited(3))
        .timeout(std::time::Duration::from_secs(60))
        .connect_timeout(std::time::Duration::from_secs(10))
        .danger_accept_invalid_certs(true)
        .build()
        .map_err(|e| format!("Failed to create client: {}", e))?;
    
    let method = request.method.parse::<reqwest::Method>()
        .map_err(|e| format!("Invalid method: {}", e))?;
    
    let mut req_builder = client.request(method, &request.url);
    
    // Add headers
    for (key, value) in request.headers {
        req_builder = req_builder.header(key, value);
    }
    
    // Add body if present
    if let Some(body) = request.body {
        req_builder = req_builder.body(body);
    }
    
    // Send request
    let response = req_builder.send().await
        .map_err(|e| format!("Request failed: {}", e))?;
    
    let status = response.status().as_u16();
    
    // Get response headers
    let mut headers = HashMap::new();
    for (key, value) in response.headers() {
        if let Ok(value_str) = value.to_str() {
            headers.insert(key.to_string(), value_str.to_string());
        }
    }
    
    // Get response body
    let body = response.bytes().await
        .map_err(|e| format!("Failed to read response body: {}", e))?
        .to_vec();
    
    Ok(ProxyResponse {
        status,
        headers,
        body,
    })
}
