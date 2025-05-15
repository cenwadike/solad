use thiserror::Error;

#[derive(Error, Debug)]
pub enum UserApiError {
    #[error("Request failed: {0}")]
    RequestError(#[from] reqwest::Error),
    #[error("API error: {0}")]
    ApiError(String),
    #[error("Not found")]
    NotFound,
    #[error("Invalid base64 data: {0}")]
    Base64Error(#[from] base64::DecodeError),
    #[error("Solana transaction error: {0}")]
    SolanaError(String),
    #[error("Upload PDA mismatch")]
    PdaMismatch,
}

impl UserApiError {
    /// Converts an HTTP response to a UserApiError.
    /// Returns NotFound for 404 status, otherwise ApiError with the response text.
    pub async fn from_response(response: reqwest::Response) -> Self {
        if response.status() == 404 {
            return UserApiError::NotFound;
        }
        let message = response
            .text()
            .await
            .unwrap_or_else(|_| "Unknown error".into());
        UserApiError::ApiError(message)
    }
}