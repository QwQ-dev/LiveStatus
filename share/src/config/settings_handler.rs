use crate::config::settings::{ClientSettings, ServerSettings};
use once_cell::sync::Lazy;
use regex::Regex;
use std::path::PathBuf;

pub fn get_client_settings_path_buf() -> PathBuf {
    PathBuf::from("config")
        .join("client-settings")
        .with_extension("yml")
}

pub fn get_server_settings_path_buf() -> PathBuf {
    PathBuf::from("config")
        .join("server-settings")
        .with_extension("yml")
}

pub static CLIENT_SETTINGS_CONTENT: Lazy<String> = Lazy::new(|| {
    let settings_path_buf = get_client_settings_path_buf();

    if let Some(parent_dir) = settings_path_buf.parent() {
        std::fs::create_dir_all(parent_dir).expect("Failed to create config dir");
    }

    if !std::fs::exists(&settings_path_buf).expect("Failed to check for client settings existence")
    {
        "".to_string()
    } else {
        std::fs::read_to_string(&settings_path_buf).expect("Failed read client-settings.yml")
    }
});

pub static CLIENT_SETTINGS: Lazy<ClientSettings> = Lazy::new(|| {
    if CLIENT_SETTINGS_CONTENT.is_empty() {
        let new_settings = ClientSettings::default();
        let new_settings_string =
            serde_yaml::to_string(&new_settings).expect("Failed serialize client settings");
        std::fs::write(get_client_settings_path_buf(), new_settings_string)
            .expect("Failed write client settings");

        return new_settings;
    }

    serde_yaml::from_str(&CLIENT_SETTINGS_CONTENT)
        .expect("Failed parse client settings. Please delete client settings from config file and re-create it.")
});

pub static SERVER_SETTINGS_CONTENT: Lazy<String> = Lazy::new(|| {
    let settings_path_buf = get_server_settings_path_buf();

    if let Some(parent_dir) = settings_path_buf.parent() {
        std::fs::create_dir_all(parent_dir).expect("Failed to create config dir");
    }

    if !std::fs::exists(&settings_path_buf).expect("Failed to check for server settings existence")
    {
        "".to_string()
    } else {
        std::fs::read_to_string(&settings_path_buf).expect("Failed read server-settings.yaml")
    }
});

pub static SERVER_SETTINGS: Lazy<ServerSettings> = Lazy::new(|| {
    if SERVER_SETTINGS_CONTENT.is_empty() {
        let new_settings = ServerSettings::default();
        let new_settings_string =
            serde_yaml::to_string(&new_settings).expect("Failed serialize server settings");
        std::fs::write(get_server_settings_path_buf(), new_settings_string)
            .expect("Failed write server settings");

        return new_settings;
    }

    let settings: ServerSettings = serde_yaml::from_str(&SERVER_SETTINGS_CONTENT)
        .expect("Failed parse server config. Please delete server config from config file and re-create it.");

    let mut final_settings = settings;

    for rule in &mut final_settings.filter_rule {
        rule.compiled_regex = Some(Regex::new(&rule.regex).unwrap_or_else(|_| {
            panic!(
                "Invalid regex pattern in server configuration for rule: '{}'. Replacement: '{}'",
                rule.regex, rule.replacement
            )
        }));
    }

    final_settings
});
