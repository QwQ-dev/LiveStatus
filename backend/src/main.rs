mod device_manager;

use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::get;
use axum::{Extension, Json, Router};
use log::info;
use share::config::settings::ServerSettings;
use share::config::settings_handler::SERVER_SETTINGS;
use share::log::log_manager::setup_logging;
use share::status::Status;
use std::sync::Arc;

#[tokio::main]
async fn main() {
    if let Err(error) = setup_logging() {
        eprintln!("[FATAL] Failed to initialize logging: {}", error);
        return;
    }

    let settings: &'static ServerSettings = &SERVER_SETTINGS;
    info!("Successfully initialized the settings.");

    let device_tracker = device_manager::DeviceTracker::new();
    let listener = tokio::net::TcpListener::bind(&settings.host).await.unwrap();

    let router = Router::new()
        .route("/api/status", get(get_status).put(put_status))
        .layer(Extension(device_tracker));

    info!("LiveStatus Backend listening on {}", &settings.host);

    axum::serve(listener, router).await.unwrap();
}

async fn put_status(
    Extension(tracker): Extension<Arc<device_manager::DeviceTracker>>,
    Json(new_status): Json<Status>,
) -> impl IntoResponse {
    tracker.update_status(&new_status).await;
    StatusCode::OK.into_response()
}

async fn get_status(
    Extension(tracker): Extension<Arc<device_manager::DeviceTracker>>,
) -> Json<Vec<Status>> {
    Json(tracker.get_active_statuses().await)
}
