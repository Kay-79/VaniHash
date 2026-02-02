/// Pattern validation and matching logic
module vanihash::pattern;

use std::string::{Self, String};
use std::vector;
use vanihash::errors;

/// Validate that pattern contains only valid hex characters
public fun validate_pattern(pattern: &String): bool {
    let bytes = string::bytes(pattern);
    let len = vector::length(bytes);

    if (len == 0) return false;

    let mut i = 0;
    while (i < len) {
        let byte = *vector::borrow(bytes, i);
        let is_valid =
            (byte >= 48 && byte <= 57) || // 0-9
                          (byte >= 97 && byte <= 102); // a-f
        if (!is_valid) return false;
        i = i + 1;
    };

    true
}

/// Verify if the object ID matches ALL provided patterns (AND logic)
/// Empty patterns are ignored (always match)
public fun verify_pattern(id: &ID, prefix: &String, suffix: &String, contains: &String): bool {
    let id_bytes = object::id_to_bytes(id);
    let hex_string = id_to_hex_string(&id_bytes);
    let id_str_bytes = string::bytes(&hex_string);

    // Check Prefix
    if (!string::is_empty(prefix)) {
        if (!starts_with(id_str_bytes, string::bytes(prefix))) return false;
    };

    // Check Suffix
    if (!string::is_empty(suffix)) {
        if (!ends_with(id_str_bytes, string::bytes(suffix))) return false;
    };

    // Check Contains
    if (!string::is_empty(contains)) {
        if (!contains(id_str_bytes, string::bytes(contains))) return false;
    };

    true
}

/// Converts 32-byte ID to 64-char lowercase hex string
fun id_to_hex_string(bytes: &vector<u8>): String {
    let mut hex_chars = vector::empty<u8>();
    let len = vector::length(bytes);
    let mut i = 0;
    while (i < len) {
        let b = *vector::borrow(bytes, i);
        let high = b >> 4;
        let low = b & 0x0F;
        vector::push_back(&mut hex_chars, nibble_to_hex(high));
        vector::push_back(&mut hex_chars, nibble_to_hex(low));
        i = i + 1;
    };
    string::utf8(hex_chars)
}

/// Convert a nibble (0-15) to hex char (0-9, a-f)
fun nibble_to_hex(n: u8): u8 {
    if (n < 10) {
        48 + n // '0' + n
    } else {
        97 + (n - 10) // 'a' + (n - 10)
    }
}

/// Check if haystack starts with needle
fun starts_with(haystack: &vector<u8>, needle: &vector<u8>): bool {
    let h_len = vector::length(haystack);
    let n_len = vector::length(needle);
    if (n_len > h_len) return false;

    let mut i = 0;
    while (i < n_len) {
        if (vector::borrow(haystack, i) != vector::borrow(needle, i)) return false;
        i = i + 1;
    };
    true
}

/// Check if haystack ends with needle
fun ends_with(haystack: &vector<u8>, needle: &vector<u8>): bool {
    let h_len = vector::length(haystack);
    let n_len = vector::length(needle);
    if (n_len > h_len) return false;

    let start = h_len - n_len;
    let mut i = 0;
    while (i < n_len) {
        if (vector::borrow(haystack, start + i) != vector::borrow(needle, i)) return false;
        i = i + 1;
    };
    true
}

/// Check if haystack contains needle
fun contains(haystack: &vector<u8>, needle: &vector<u8>): bool {
    let h_len = vector::length(haystack);
    let n_len = vector::length(needle);
    if (n_len > h_len) return false;
    if (n_len == 0) return true;

    let mut i = 0;
    while (i <= h_len - n_len) {
        let mut match_found = true;
        let mut j = 0;
        while (j < n_len) {
            if (vector::borrow(haystack, i + j) != vector::borrow(needle, j)) {
                match_found = false;
                break
            };
            j = j + 1;
        };
        if (match_found) return true;
        i = i + 1;
    };
    false
}
