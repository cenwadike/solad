use sha2::{Sha256, Digest};

pub fn hash (data: &str) -> String {
    // let input = "hello world";

    // Create a SHA-256 hasher
    let mut hasher = Sha256::new();

    // Feed the input data
    hasher.update(data);

    // Finalize the hash
    let result = hasher.finalize();

    // Convert to hexadecimal string
    format!("{:x}", result)
}


pub fn brute_force_hash(target_hash: &str, max_length: usize) -> Option<String> {
    // Generate all possible strings up to `max_length` and check their hashes
    // (This is a simplified example for demonstration)
    for c in b'a'..=b'z' {
        let guess = String::from(char::from(c));
        let hash = format!("{:x}", Sha256::digest(&guess));
        if hash == target_hash {
            return Some(guess);
        }
    }
    None
}