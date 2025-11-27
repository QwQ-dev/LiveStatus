use active_win_pos_rs::get_active_window;
use flexi_logger::{
    Age, Cleanup, Criterion, Duplicate, FlexiLoggerError, Logger, LoggerHandle, Naming,
};
use fs2::FileExt;
use reqwest::{Client, Error, Response};
use share::settings::ClientSettings;
use share::settings_handler::CLIENT_SETTINGS;
use share::status::Status;
use std::fs::File;
use std::time::Duration;
use tokio::time::sleep;

const LOG_FILE_BASENAME: &str = "status_reporter";
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
        log::info!("Successfully acquired application lock.");
    }

    let settings: &'static ClientSettings = &CLIENT_SETTINGS;
    log::info!("Successfully initialized the settings.");

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
                log::info!("Sent status: {} - {}", status.title, status.app_name);
            }
            Err(error) => {
                log::error!("Failed to send status: {}", error);
            }
        }
    }
}

fn setup_singleton_lock() -> Result<File, std::io::Error> {
    let file = File::create(LOCK_FILE_NAME)?;
    file.try_lock_exclusive()?;
    Ok(file)
}

fn setup_logging() -> Result<LoggerHandle, FlexiLoggerError> {
    Logger::try_with_str("info")?
        .format(log_format)
        .log_to_file(
            flexi_logger::FileSpec::default()
                .directory("logs")
                .basename(LOG_FILE_BASENAME),
        )
        .duplicate_to_stderr(Duplicate::Info)
        .append()
        .rotate(
            Criterion::Age(Age::Day),
            Naming::Timestamps,
            Cleanup::KeepLogFiles(7),
        )
        .start()
}

pub fn log_format(
    w: &mut dyn std::io::Write,
    now: &mut flexi_logger::DeferredNow,
    record: &log::Record,
) -> Result<(), std::io::Error> {
    write!(
        w,
        "[{}] [{}] {}",
        now.now().format("%Y-%m-%d %H:%M:%S"),
        record.level(),
        &record.args()
    )
}

fn get_active_window_status() -> Result<Status, ()> {
    let active_window = get_active_window()?;
    Ok(Status::new(active_window.title, active_window.app_name))
}
