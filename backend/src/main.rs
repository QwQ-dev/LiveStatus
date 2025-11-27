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
use std::sync::Arc;
use std::time::SystemTime;
use tokio::sync::Mutex;

type SharedStatus = Arc<Mutex<Status>>;
type SharedStatusTime = Arc<Mutex<u128>>;

static CURRENT_STATUS: Lazy<SharedStatus> = Lazy::new(|| Arc::new(Mutex::new(Status::offline())));
static CURRENT_STATUS_TIME: Lazy<SharedStatusTime> =
    Lazy::new(|| Arc::new(Mutex::new(get_now_time_ms())));

#[tokio::main]
async fn main() {
    let settings: &'static ServerSettings = &SERVER_SETTINGS;

    let app = Router::new()
        .route("/api/status", get(get_status).put(put_status))
        .layer(Extension(CURRENT_STATUS.clone()))
        .layer(Extension(CURRENT_STATUS_TIME.clone()));

    let listener = tokio::net::TcpListener::bind(&settings.host).await.unwrap();

    println!("LiveStatus Backend listening on {}", &settings.host);

    axum::serve(listener, app).await.unwrap();
}

async fn put_status(
    headers: HeaderMap,
    Extension(current_status): Extension<SharedStatus>,
    Extension(current_status_time): Extension<SharedStatusTime>,
    Json(new_status): Json<Status>,
) -> impl IntoResponse {
    let auth_header = headers
        .get("Authorization")
        .and_then(|value| value.to_str().ok())
        .map(|s| s.trim());

    if auth_header != Some(&SERVER_SETTINGS.key) {
        return StatusCode::UNAUTHORIZED.into_response();
    }

    let mut now_time_lock = current_status_time.lock().await;
    let mut now_status_lock = current_status.lock().await;

    *now_status_lock = new_status;
    *now_time_lock = get_now_time_ms();

    println!(
        "Now status: {}, {}, {}, {}",
        now_status_lock.app_name,
        now_status_lock.title,
        now_status_lock.os_name,
        now_status_lock.force_status_type
    );

    StatusCode::OK.into_response()
}

async fn get_status(
    Extension(current_status): Extension<SharedStatus>,
    Extension(current_status_time): Extension<SharedStatusTime>,
) -> Json<Status> {
    let last_update_time_lock = current_status_time.lock().await;
    let status_lock = current_status.lock().await;

    if get_now_time_ms().saturating_sub(*last_update_time_lock) > (20 * 1000) {
        Json(Status::offline())
    } else {
        Json(status_lock.clone())
    }
}

fn get_now_time_ms() -> u128 {
    SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap()
        .as_millis()
}
