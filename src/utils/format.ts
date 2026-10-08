export function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

export function formatWeekday(value: number) {
  return value === 8 ? "Chủ nhật" : `Thứ ${value}`;
}
