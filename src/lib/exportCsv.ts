/**
 * Export data to CSV file
 */
export function exportToCsv(
    data: Record<string, unknown>[],
    filename: string,
    headers?: Record<string, string>
) {
    if (data.length === 0) return;
    const keys = Object.keys(headers || data[0]);
    const headerRow = keys.map(k => headers?.[k] || k).join(',');
    const rows = data.map(row =>
        keys.map(k => {
            const val = row[k];
            const str = val === null || val === undefined ? '' : String(val);
            // Escape commas and quotes
            return str.includes(',') || str.includes('"')
                ? `"${str.replace(/"/g, '""')}"`
                : str;
        }).join(',')
    );
    const csv = [headerRow, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}
