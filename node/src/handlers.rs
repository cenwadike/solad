use actix_web::{web, HttpResponse};
use rocksdb::DB;
use serde::Deserialize;
use std::sync::Arc;

use crate::error::{ApiError, ApiError::NotFound};
use crate::models::{KeyQuery, KeyValuePayload};
// use crate::utils::{hash, brute_force_hash};

// Get value by key
pub async fn get_value(
    db: web::Data<Arc<DB>>,
    query: web::Query<KeyQuery>,
) -> Result<HttpResponse, ApiError> {
    let value = db
        .get(query.key.as_bytes())
        .map_err(ApiError::Database)?
        .ok_or(NotFound)?;

    Ok(HttpResponse::Ok().body(value))
}

// Set key-value pair
pub async fn set_value(
    db: web::Data<Arc<DB>>,
    payload: web::Json<KeyValuePayload>,
) -> Result<HttpResponse, ApiError> {
    // check hash and compared  data


    // node must be registered on blockchain

    //node must verify payment with event

    // in payment is correct store data else report user for slashing


    db.put(payload.key.as_bytes(), payload.data.as_bytes())
        .map_err(ApiError::Database)?;

    //gossip to other node in shard with data u stored

    //request first payment for itself

    // reponse success to user

    Ok(HttpResponse::Ok().body("data set"))
}

// Delete key
pub async fn delete_value(
    db: web::Data<Arc<DB>>,
    query: web::Query<KeyQuery>,
) -> Result<HttpResponse, ApiError> {
    db.delete(query.key.as_bytes())
        .map_err(ApiError::Database)?;

    Ok(HttpResponse::Ok().body("Key deleted"))
}