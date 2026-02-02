/// Error constants for the VaniHash protocol
module vanihash::errors;

// Task creation errors
const EInsufficientReward: u64 = 1;
const EInvalidPattern: u64 = 2;
const EInvalidPatternType: u64 = 3;
const ELockUpTooShort: u64 = 4;

// Task state errors
const ETaskNotActive: u64 = 10;
const ETaskNotPending: u64 = 11;
const ETaskAlreadyCompleted: u64 = 12;

// Permission errors
const ENotCreator: u64 = 20;
const ENotAdmin: u64 = 21;

// Validation errors
const EInvalidProof: u64 = 30;
const EGracePeriodActive: u64 = 31;
const ELockPeriodActive: u64 = 32;
const EInvalidObjectType: u64 = 33;

// Public getters for error codes
public fun insufficient_reward(): u64 { EInsufficientReward }

public fun invalid_pattern(): u64 { EInvalidPattern }

public fun invalid_pattern_type(): u64 { EInvalidPatternType }

public fun lockup_too_short(): u64 { ELockUpTooShort }

public fun task_not_active(): u64 { ETaskNotActive }

public fun task_not_pending(): u64 { ETaskNotPending }

public fun not_creator(): u64 { ENotCreator }

public fun not_admin(): u64 { ENotAdmin }

public fun invalid_proof(): u64 { EInvalidProof }

public fun grace_period_active(): u64 { EGracePeriodActive }

public fun lock_period_active(): u64 { ELockPeriodActive }

public fun invalid_object_type(): u64 { EInvalidObjectType }
