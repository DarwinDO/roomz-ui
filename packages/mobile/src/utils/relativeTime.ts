const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

export function formatRelativeTime(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();

    if (diffMs < 0) {
        return date.toLocaleDateString('vi-VN');
    }

    const diffMin = Math.floor(diffMs / MINUTE_MS);
    const diffHour = Math.floor(diffMs / HOUR_MS);
    const diffDay = Math.floor(diffMs / DAY_MS);

    if (diffMin < 1) return 'Vừa xong';
    if (diffMin < 60) return `${diffMin} phút trước`;
    if (diffHour < 24) return `${diffHour} giờ trước`;
    if (diffDay === 1) return 'Hôm qua';
    if (diffDay < 7) return `${diffDay} ngày trước`;

    return date.toLocaleDateString('vi-VN');
}
