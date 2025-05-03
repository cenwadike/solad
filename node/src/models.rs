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

    #[validate(length(min = 1, message = "hash cannot be empty"))]
    pub hash: String,

    #[validate(length(min = 1, message = "data cannot be empty"))]
    pub data: Vec<u8>,

    #[validate(range(min = 1, message = "shard must be greater than 0"))]
    pub shard: u32,

    #[validate(length(min = 1, message = "upload_pda cannot be empty"))]
    pub upload_pda: String,

    #[validate(length(min = 1, message = "format cannot be empty"))]
    pub format: String,
}
