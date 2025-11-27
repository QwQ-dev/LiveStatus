use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Status {
    pub title: String,
    pub app_name: String,
    pub os_name: String,
    pub force_status_type: String,
}

impl Status {
    pub fn new(title: String, app_name: String) -> Status {
        Status {
            title,
            app_name,
            os_name: std::env::consts::OS.to_string(),
            force_status_type: "N/A".to_string(),
        }
    }

    pub fn with_os(title: String, app_name: String, os_name: String) -> Status {
        Status {
            title,
            app_name,
            os_name,
            force_status_type: "N/A".to_string(),
        }
    }

    pub fn with_forced_status(
        title: String,
        app_name: String,
        force_status_type: String,
    ) -> Status {
        Status {
            title,
            app_name,
            os_name: std::env::consts::OS.to_string(),
            force_status_type,
        }
    }

    pub fn na() -> Status {
        Status::new("N/A".to_string(), "N/A".to_string())
    }

    pub fn offline() -> Status {
        Status {
            title: "Client is currently offline.".to_string(),
            app_name: "Offline".to_string(),
            os_name: "Offline".to_string(),
            force_status_type: "N/A".to_string(),
        }
    }
}
