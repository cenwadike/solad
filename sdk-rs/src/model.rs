use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SetData {
    pub key: String,
    pub hash: String,
    pub data: Vec<u8>,
    pub shard: u32,
    pub upload_pda: String,
    pub format: String
}