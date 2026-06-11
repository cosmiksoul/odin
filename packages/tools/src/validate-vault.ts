import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { catalogSchema, validateCatalog } from '@odin/core';

// npm -w запускает скрипты с cwd = packages/tools, поэтому относительные пути — от корня репо
const ROOT = join(import.meta.dirname, '../../..');
const vaultDir = resolve(ROOT, process.argv[2] ?? 'vault-demo');
const catalogPath = join(vaultDir, 'catalog.json');

if (!existsSync(catalogPath)) {
  console.error(`Не найден ${catalogPath}. Vault должен содержать catalog.json.`);
  process.exit(1);
}

let raw: unknown;
try {
  raw = JSON.parse(readFileSync(catalogPath, 'utf8'));
} catch (e) {
  console.error(`catalog.json — невалидный JSON: ${(e as Error).message}`);
  process.exit(1);
}

const parsed = catalogSchema.safeParse(raw);
if (!parsed.success) {
  console.error('catalog.json не соответствует схеме:');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

const report = validateCatalog(parsed.data);
for (const issue of report.issues) {
  console.log(`[${issue.level}] ${issue.code}: ${issue.message}`);
}
console.log(
  `${parsed.data.metrics.length} метрик; ошибок: ${report.issues.filter((i) => i.level === 'error').length}, предупреждений: ${report.issues.filter((i) => i.level === 'warning').length}`,
);
process.exit(report.ok ? 0 : 1);
