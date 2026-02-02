export const GRACE_PERIOD_MS = 15 * 60 * 1000; // 15 minutes

export function isInGracePeriod(createdAt: number | string): boolean {
    const created = typeof createdAt === 'string' ? parseInt(createdAt) : createdAt;
    const now = Date.now();
    return now < created + GRACE_PERIOD_MS;
}

export function getGracePeriodRemaining(createdAt: number | string): number {
    const created = typeof createdAt === 'string' ? parseInt(createdAt) : createdAt;
    const expiresAt = created + GRACE_PERIOD_MS;
    const now = Date.now();
    return Math.max(0, expiresAt - now);
}

export function getGracePeriodExpiryTime(createdAt: number | string): number {
    const created = typeof createdAt === 'string' ? parseInt(createdAt) : createdAt;
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
