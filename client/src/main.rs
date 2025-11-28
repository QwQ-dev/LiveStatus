use active_win_pos_rs::get_active_window;
use fs2::FileExt;
use log::{error, info};
use reqwest::{Client, Error, Response};
use share::config::settings::ClientSettings;
use share::config::settings_handler::CLIENT_SETTINGS;
use share::log::log_manager::setup_logging;
use share::status::Status;
use std::fs::File;
use std::time::Duration;
use tokio::time::sleep;

const LOCK_FILE_NAME: &str = "status_reporter.lock";

#[tokio::main]
async fn main() {
    if let Err(error) = setup_logging() {
        eprintln!("[FATAL] Failed to initialize logging: {}", error);
        return;
    }

    if let Err(error) = setup_singleton_lock() {
        log::error!(
            "[FATAL] Another instance is already running or failed to acquire lock: {}",
            error
        );
        return;
    } else {
        info!("Successfully acquired application lock.");
    }

    let settings: &'static ClientSettings = &CLIENT_SETTINGS;
    info!("Successfully initialized the settings.");

    let client = Client::new();
    let auth_header_value = settings.key.to_string();
    let url = settings.url.to_string();

    loop {
        sleep(Duration::from_secs(settings.update_interval_secs)).await;

        let status = get_active_window_status().unwrap_or_else(|()| Status::na());

        let request_result: Result<Response, Error> = client
            .put(&url)
            .header("Authorization", &auth_header_value)
            .json(&status)
            .send()
            .await;

        match request_result {
            Ok(_) => {
                info!("Sent status: {} - {}", status.title, status.app_name);
            }
            Err(error) => {
                error!("Failed to send status: {}", error);
            }
        }
    }
}

fn setup_singleton_lock() -> Result<File, std::io::Error> {
    let file = File::create(LOCK_FILE_NAME)?;
    file.try_lock_exclusive()?;
    Ok(file)
}

fn get_active_window_status() -> Result<Status, ()> {
    let active_window = get_active_window()?;
    Ok(Status::new(active_window.title, active_window.app_name))
}
