use actix_web::http::StatusCode;
use actix_web::{Error as ActixError, HttpResponse, ResponseError};
use rocksdb::Error as RocksDBError;
use solana_client::client_error::ClientError;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ApiError {
    #[error("Database error: {0}")]
    Database(#[from] RocksDBError),
    #[error("Key not found")]
    NotFound,
    #[error("Log subscription failed")]
    SubscriptionFailed,
    #[error("Data hash is invalid")]
    InvalidHash,
    #[error("Node is not registered")]
    NodeNotRegistered,
    #[error("Payment could not be verified")]
    PaymentNotVerified,
    #[error("Network error: {0}")]
    NetworkError(#[from] anyhow::Error),
    #[error("Internal error: {0}")]
    InternalError(String), // Added for serialization/timestamp errors
}

// Implement From<solana_client::ClientError> for ApiError
impl From<ClientError> for ApiError {
    fn from(err: ClientError) -> Self {
        ApiError::NetworkError(anyhow::anyhow!(err.to_string()))
    }
}

// Implement From<actix_web::Error> for ApiError
impl From<ActixError> for ApiError {
    fn from(err: ActixError) -> Self {
        ApiError::NetworkError(anyhow::anyhow!(err.to_string()))
    }
}

impl ResponseError for ApiError {
    fn status_code(&self) -> StatusCode {
        match self {
            ApiError::Database(_) => StatusCode::INTERNAL_SERVER_ERROR,
            ApiError::NetworkError(_) => StatusCode::INTERNAL_SERVER_ERROR,
            ApiError::NotFound => StatusCode::NOT_FOUND,
            ApiError::SubscriptionFailed => StatusCode::PRECONDITION_FAILED,
            ApiError::InvalidHash => StatusCode::NOT_ACCEPTABLE,
            ApiError::NodeNotRegistered => StatusCode::PRECONDITION_FAILED,
            ApiError::PaymentNotVerified => StatusCode::PAYMENT_REQUIRED,
            ApiError::InternalError(_) => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }

    fn error_response(&self) -> HttpResponse {
        HttpResponse::build(self.status_code()).body(self.to_string())
    }
}
