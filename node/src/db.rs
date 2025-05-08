use rocksdb::{Options, DB};
use std::path::Path;
use std::sync::Arc;

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
}
