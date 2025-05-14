use thiserror::Error;

#[derive(Error, Debug)]
pub enum UserApiError {
    #[error("Request failed: {0}")]
    RequestError(#[from] reqwest::Error),
    #[error("API error: {0}")]
    ApiError(String),
    #[error("Not found")]
    NotFound,
}

impl UserApiError {
   pub async fn from_response(response: reqwest::Response) -> Self {
        if response.status() == 404 {
            return UserApiError::NotFound;
        }
        let message = response.text().await.unwrap_or_else(|_| "Unknown error".into());
        UserApiError::ApiError(message)
    }
}