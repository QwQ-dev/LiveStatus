use axum::response::IntoResponse;
use axum::{
    extract::{Extension, Json},
    http::{HeaderMap, StatusCode},
    routing::get,
    Router,
};
use once_cell::sync::Lazy;
use share::settings::ServerSettings;
use share::settings_handler::SERVER_SETTINGS;
use share::status::Status;
use std::collections::HashMap;
use std::sync::Arc;
use std::time::SystemTime;
use tokio::sync::Mutex;

#[derive(Clone)]
struct DeviceStatus {
    status: Status,
    last_update: u128,
}

type DeviceStatusMap = Arc<Mutex<HashMap<String, DeviceStatus>>>;

static DEVICE_STATUSES: Lazy<DeviceStatusMap> = Lazy::new(|| Arc::new(Mutex::new(HashMap::new())));

const TIMEOUT_MS: u128 = 20 * 1000;

#[tokio::main]
async fn main() {
    let settings: &'static ServerSettings = &SERVER_SETTINGS;

    let app = Router::new()
        .route("/api/status", get(get_status).put(put_status))
        .layer(Extension(DEVICE_STATUSES.clone()));

    let listener = tokio::net::TcpListener::bind(&settings.host).await.unwrap();

    println!("LiveStatus Backend listening on {}", &settings.host);

    axum::serve(listener, app).await.unwrap();
}

async fn put_status(
    headers: HeaderMap,
    Extension(device_statuses): Extension<DeviceStatusMap>,
    Json(new_status): Json<Status>,
) -> impl IntoResponse {
    let auth_header = headers
        .get("Authorization")
        .and_then(|value| value.to_str().ok())
        .map(|s| s.trim());

    if auth_header != Some(&SERVER_SETTINGS.key) {
        return StatusCode::UNAUTHORIZED.into_response();
    }

    let os_name = new_status.os_name.clone();
    let mut statuses = device_statuses.lock().await;

    statuses.insert(
        os_name.clone(),
        DeviceStatus {
            status: new_status.clone(),
            last_update: get_now_time_ms(),
        },
    );

    println!(
        "Status ({}): title: {}, name: {}, type: {}",
        new_status.os_name, new_status.title, new_status.app_name, new_status.force_status_type
    );

    StatusCode::OK.into_response()
}

async fn get_status(Extension(device_statuses): Extension<DeviceStatusMap>) -> Json<Vec<Status>> {
    let statuses = device_statuses.lock().await;
    let now = get_now_time_ms();

    let active_statuses: Vec<Status> = statuses
        .values()
        .filter(|device| now.saturating_sub(device.last_update) <= TIMEOUT_MS)
        .map(|device| device.status.clone())
        .collect();

    Json(active_statuses)
}

fn get_now_time_ms() -> u128 {
    SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap()
        .as_millis()
}
