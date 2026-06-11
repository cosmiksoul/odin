/** Имя метрики -> metric_id. Сид содержит только ASCII-имена (проверено при миграции). */
export function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  if (!slug) throw new Error(`slugify: empty slug for name "${name}"`);
  return slug;
}
