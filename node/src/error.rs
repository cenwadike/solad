/// This module defines a custom error type `ApiError` for handling errors in a decentralized
/// storage network API. It integrates with Actix-web for HTTP error responses and provides
/// conversions from other error types (e.g., RocksDB and Solana client errors). The module
/// ensures consistent error handling and appropriate HTTP status codes for various failure
/// scenarios.
use actix_web::http::StatusCode;
use actix_web::{Error as ActixError, HttpResponse, ResponseError};
use rocksdb::Error as RocksDBError;
use solana_client::client_error::ClientError;
use thiserror::Error;

/// Custom error type for the API, encapsulating various error conditions.
///
/// `ApiError` is used to represent errors that can occur during API operations, such as
/// database failures, invalid data, network issues, or payment verification failures. It
/// implements `thiserror::Error` for structured error handling and `ResponseError` for
/// Actix-web integration.
#[derive(Error, Debug)]
pub enum ApiError {
    /// Error from RocksDB database operations.
    #[error("Database error: {0}")]
    Database(#[from] RocksDBError),

    /// Key not found in the database.
    #[error("Key not found")]
    NotFound,

    /// Failure to subscribe to Solana transaction logs.
    #[error("Log subscription failed")]
    SubscriptionFailed,

    /// Data hash does not match the expected value.
    #[error("Data hash is invalid")]
    InvalidHash,

    /// Node is not registered in the network.
    #[error("Node is not registered")]
    NodeNotRegistered,

    /// Payment for the upload could not be verified.
    #[error("Payment could not be verified")]
    PaymentNotVerified,

    /// General network error, wrapping an `anyhow::Error`.
    #[error("Network error: {0}")]
    NetworkError(#[from] anyhow::Error),

    /// Internal error for miscellaneous issues (e.g., serialization, timestamp).
    #[error("Internal error: {0}")]
    InternalError(String),
}

/// Converts a `solana_client::ClientError` into an `ApiError`.
///
/// Maps Solana client errors to the `NetworkError` variant with the error message
/// wrapped in an `anyhow::Error`.
impl From<ClientError> for ApiError {
    fn from(err: ClientError) -> Self {
        ApiError::NetworkError(anyhow::anyhow!(err.to_string()))
    }
}

/// Converts an `actix_web::Error` into an `ApiError`.
///
/// Maps Actix-web errors to the `NetworkError` variant with the error message
/// wrapped in an `anyhow::Error`.
impl From<ActixError> for ApiError {
    fn from(err: ActixError) -> Self {
        ApiError::NetworkError(anyhow::anyhow!(err.to_string()))
    }
}

/// Implements Actix-web's `ResponseError` trait for `ApiError`.
///
/// Defines how `ApiError` variants are mapped to HTTP status codes and response bodies
/// for API error responses.
impl ResponseError for ApiError {
    /// Maps each `ApiError` variant to an appropriate HTTP status code.
    ///
    /// # Returns
    ///
    /// * `StatusCode` - The HTTP status code corresponding to the error variant.
    ///
    /// # Mapping
    ///
    /// - `Database`: 500 Internal Server Error
    /// - `NetworkError`: 500 Internal Server Error
    /// - `NotFound`: 404 Not Found
    /// - `SubscriptionFailed`: 412 Precondition Failed
    /// - `InvalidHash`: 406 Not Acceptable
    /// - `NodeNotRegistered`: 412 Precondition Failed
    /// - `PaymentNotVerified`: 402 Payment Required
    /// - `InternalError`: 500 Internal Server Error
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

    /// Generates an HTTP response for the error.
    ///
    /// Creates an `HttpResponse` with the appropriate status code and the error message
    /// as the body.
    ///
    /// # Returns
    ///
    /// * `HttpResponse` - An HTTP response with the status code and error message.
    ///
    /// # Examples
    ///
    /// ```rust
    /// use actix_web::{HttpResponse, ResponseError};
    /// use crate::error::ApiError;
    ///
    /// let error = ApiError::NotFound;
    /// let response = error.error_response();
    /// assert_eq!(response.status(), actix_web::http::StatusCode::NOT_FOUND);
    /// ```
    fn error_response(&self) -> HttpResponse {
        HttpResponse::build(self.status_code()).body(self.to_string())
    }
}
