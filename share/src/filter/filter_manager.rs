use crate::config::settings_handler::SERVER_SETTINGS;
use crate::status::Status;

pub fn filter_status(original_status: &Status) -> Status {
    let mut filtered_status = original_status.clone();

    filtered_status.title = filter_text(&original_status.title);
    filtered_status.app_name = filter_text(&original_status.app_name);
    filtered_status.os_name = filter_text(&original_status.os_name);

    filtered_status
}

pub fn filter_text(text: &str) -> String {
    let mut result = text.to_string();

    for rule in &SERVER_SETTINGS.filter_rule {
        if let Some(regex) = &rule.compiled_regex {
            result = regex
                .replace(result.as_str(), &rule.replacement)
                .to_string();
        }
    }

    result
}
