use regex::Regex;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FilterRule {
    pub regex: String,
    pub replacement: String,

    #[serde(skip_serializing, skip_deserializing)]
    pub compiled_regex: Option<Regex>,
}
