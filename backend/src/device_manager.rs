use log::info;
use share::config::settings_handler::SERVER_SETTINGS;
use share::filter::filter_manager::filter_status;
use share::status::Status;
use std::collections::HashMap;
use std::sync::Arc;
use std::time::SystemTime;
use tokio::sync::Mutex;

#[derive(Clone)]
pub struct DeviceStatus {
    pub status: Status,
    pub last_update: u128,
}

pub struct DeviceTracker {
    statuses: Arc<Mutex<HashMap<String, DeviceStatus>>>,
    timeout_ms: u128,
}

impl DeviceTracker {
    pub fn new() -> Arc<Self> {
        Arc::new(DeviceTracker {
            statuses: Arc::new(Mutex::new(HashMap::new())),
            timeout_ms: (SERVER_SETTINGS.timeout_secs * 1000) as u128,
        })
    }

    pub async fn update_status(&self, new_status: &Status) {
        let status = filter_status(new_status);
        let mut statuses = self.statuses.lock().await;

        let title_clone = status.title.clone();
        let app_name_clone = status.app_name.clone();
        let os_name_clone = status.os_name.clone();
        let force_status_type_clone = status.force_status_type.clone();

        statuses.insert(
            status.os_name.clone(),
            DeviceStatus {
                status,
                last_update: get_now_time_ms(),
            },
        );

        info!(
            "Updated status: title: {}, name: {}, os: {}, force type: {}.",
            title_clone, app_name_clone, os_name_clone, force_status_type_clone
        );
    }

    pub async fn get_active_statuses(&self) -> Vec<Status> {
        let statuses = self.statuses.lock().await;
        let now = get_now_time_ms();

        statuses
            .values()
            .filter(|device| now.saturating_sub(device.last_update) <= self.timeout_ms)
            .map(|device| device.status.clone())
            .collect()
    }
}

fn get_now_time_ms() -> u128 {
    SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap()
        .as_millis()
}
