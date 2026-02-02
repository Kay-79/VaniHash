/// Pattern validation and matching logic
module vanihash::pattern;

use std::string::{Self, String};
use std::vector;
use vanihash::errors;

/// Pattern type constants
const PATTERN_TYPE_PREFIX: u8 = 0;
const PATTERN_TYPE_SUFFIX: u8 = 1;
const PATTERN_TYPE_CONTAINS: u8 = 2;

// Public getters
public fun pattern_type_prefix(): u8 { PATTERN_TYPE_PREFIX }

public fun pattern_type_suffix(): u8 { PATTERN_TYPE_SUFFIX }

public fun pattern_type_contains(): u8 { PATTERN_TYPE_CONTAINS }

/// Validate that pattern type is valid
public fun validate_pattern_type(pattern_type: u8): bool {
    pattern_type <= PATTERN_TYPE_CONTAINS
}

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

/// Verify if the object ID matches any of the patterns
public fun verify_pattern(id: &ID, patterns: &vector<String>, pattern_type: u8): bool {
    let id_bytes = object::id_to_bytes(id);
    let hex_string = id_to_hex_string(&id_bytes);
    let id_str_bytes = string::bytes(&hex_string);

    let len = vector::length(patterns);
    let mut i = 0;

    while (i < len) {
        let pattern = vector::borrow(patterns, i);
        let pattern_bytes = string::bytes(pattern);

        let matches = if (pattern_type == PATTERN_TYPE_PREFIX) {
            starts_with(id_str_bytes, pattern_bytes)
        } else if (pattern_type == PATTERN_TYPE_SUFFIX) {
            ends_with(id_str_bytes, pattern_bytes)
        } else if (pattern_type == PATTERN_TYPE_CONTAINS) {
            contains(id_str_bytes, pattern_bytes)
        } else {
            false
        };

        if (matches) {
            return true
        };

        i = i + 1;
    };

    false
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
