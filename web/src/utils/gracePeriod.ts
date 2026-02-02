export const GRACE_PERIOD_MS = 15 * 60 * 1000; // 15 minutes

function parseTimestamp(val: number | string): number {
    if (typeof val === 'number') return val;
    // Check if it's a numeric string (e.g. "1770051308381")
    if (/^\d+$/.test(val)) return parseInt(val);
    // Assume ISO string
    return new Date(val).getTime();
}

export function isInGracePeriod(createdAt: number | string): boolean {
    const created = parseTimestamp(createdAt);
    const now = Date.now();
    return now < created + GRACE_PERIOD_MS;
}

export function getGracePeriodRemaining(createdAt: number | string): number {
    const created = parseTimestamp(createdAt);
    const expiresAt = created + GRACE_PERIOD_MS;
    const now = Date.now();
    return Math.max(0, expiresAt - now);
}

export function getGracePeriodExpiryTime(createdAt: number | string): number {
    const created = parseTimestamp(createdAt);
    return created + GRACE_PERIOD_MS;
}

export function shouldBeActive(task: { status: string; created_at: number | string }): boolean {
    if (task.status !== 'PENDING') return false;
    return !isInGracePeriod(task.created_at);
}

export function formatTimeRemaining(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);

    if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
}
