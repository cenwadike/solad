use serde::{Deserialize, Serialize};
use validator::Validate;

#[derive(Deserialize)]
pub struct KeyQuery {
    pub key: String,
}

#[derive(Serialize, Deserialize, Validate)]
pub struct KeyValuePayload {
    #[validate(length(min = 1, message = "key cannot be empty"))]
    pub key: String,

    #[validate(length(min = 1, message = "key cannot be empty"))]
    pub hash: String,

    #[validate(length(min = 1, message = "value cannot be empty"))]
    pub data: String,

    // #[validate(length(min = 1, message = "value cannot be empty"))]
    pub shard: u32,
}