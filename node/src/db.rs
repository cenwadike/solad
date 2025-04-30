use rocksdb::{DB, Options};
use std::path::Path;
use std::sync::Arc;
// use crate::anchor::MyEvent;

pub struct Database {
    pub inner: Arc<DB>,
}

impl Database {
    pub fn new(path: &str) -> Result<Self, rocksdb::Error> {
        let mut opts = Options::default();
        opts.create_if_missing(true);
        let db = DB::open(&opts, Path::new(path))?;
        Ok(Self {
            inner: Arc::new(db),
        })
    }

    // pub fn store_event(&self, key: &[u8], event: &MyEvent) -> Result<(), String> {
    //     let data = bincode::serialize(event)
    //         .map_err(|e| format!("Serialization error: {}", e))?;
    //     self.db.put(key, data)
    //         .map_err(|e| format!("DB write error: {}", e))
    // }
}