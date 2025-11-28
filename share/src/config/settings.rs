use crate::filter::filter_rule::FilterRule;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct ClientSettings {
    pub url: String,
    pub key: String,
    pub update_interval_secs: u64,
}

#[derive(Serialize, Deserialize)]
pub struct ServerSettings {
    pub host: String,
    pub key: String,
    pub timeout_secs: u64,

    #[serde(default = "Vec::new")]
    pub filter_rule: Vec<FilterRule>,
}

impl Default for ClientSettings {
    fn default() -> Self {
        ClientSettings {
            url: "http://127.0.0.1:1239/api/status".to_string(),
            key: " ".to_string(),
            update_interval_secs: 5,
        }
    }
}

impl Default for ServerSettings {
    fn default() -> Self {
        ServerSettings {
            host: "127.0.0.1:1239".to_string(),
            key: " ".to_string(),
            timeout_secs: 20,
            filter_rule: Vec::new(),
        }
    }
}
