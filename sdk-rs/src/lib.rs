use crate::error::*;
use crate::model::*;
use serde_json::Value;

mod error;
mod model;


pub struct DataClient {
    client: reqwest::Client,
    base_url: String,
}

impl DataClient {
    pub fn new(base_url: &str) -> Self {
        Self {
            client: reqwest::Client::new(),
            base_url: base_url.to_string(),
        }
    }

    pub async fn set_data(&self, data: &SetData) -> Result<Value, UserApiError> {
        let url = format!("{}/api/set", self.base_url);
        let response = self.client.post(&url).json(data).send().await?;
        
        if response.status().is_success() {
            // Ok(response.json().await?)
            Ok(response.json::<Value>().await?)
        } else {
            Err(UserApiError::from_response(response).await)
        }
    }

    pub async fn get_data(&self, key: String) -> Result<Value, UserApiError> {
        let url = format!("{}/users/key={}", self.base_url, key);
        let response = self.client.get(&url).send().await?;
        
        if response.status().is_success() {
            // Ok(response.json().await?)
            Ok(response.json::<Value>().await?)
        } else if response.status() == 404 {
            Err(UserApiError::NotFound)
        } else {
            Err(UserApiError::from_response(response).await)
        }
    }
}
