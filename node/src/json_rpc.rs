use actix_web::{web, HttpResponse, post};

#[post("/rpc")]
pub async fn rpc(
    body: String,
    handler: web::Data<Arc<TokioMutex<IoHandler>>>,
) -> HttpResponse {
    let io = handler.lock().await;
    let res = io.handle_request(&body).await;

    match res {
        Some(response) => HttpResponse::Ok()
            .content_type("application/json")
            .body(response),
        None => HttpResponse::BadRequest().body("Invalid JSON-RPC request"),
    }
}
