# ODIN 2.0 — архитектура (по факту)

Монорепо npm workspaces, TypeScript везде. Дизайн и решения: `docs/superpowers/specs/2026-06-11-odin-2.0-design.md`.

## Пакеты

| Пакет | Что | Зависимости |
|---|---|---|
| `packages/core` | Типы, zod-схемы catalog.json и контракта, валидатор, граф зависимостей, интерфейс DataProvider | zod; ноль React/Node-специфики |
| `packages/tools` | Миграция сида, CLI-валидатор vault | @odin/core, tsx |
| `packages/engine` (M2) | DuckDB, чтение parquet по контракту, алерты | @odin/core, @duckdb/node-api |
| `packages/ui` (M3) | React-приложение, все вьюхи | @odin/core, react |
| `packages/desktop` (M3) | Electron main/preload, IPC ui↔engine | @odin/engine, @odin/ui |
| `packages/demo` (M7) | Web-таргет для Pages, StaticProvider | @odin/ui |
| `packages/mcp` (M6) | MCP-сервер (отдельный процесс) | @odin/engine |

## Инварианты

- `ui` знает только интерфейс `DataProvider` из `core`. Один UI — два таргета (Electron, web).
- `core` не импортирует ничего платформенного. `engine` — единственное место с DuckDB и fs.
- `metric_id` — единственный идентификатор метрики везде.
- Любая проблема vault — человекочитаемый отчёт валидатора, не крэш.

## Vault (формат пользовательских данных)

```
my-vault/
  catalog.json        # схема каталога (валидируется zod + JSON Schema)
  context/<id>.md     # опциональный MD-контекст метрики
  data/*.parquet      # значения: metric_id|date|dim_key|dim_value|value
```

## Legacy

Старый прототип (src/ в корне, ветка `legacy`) собирается `npm run build` и деплоится на
GitHub Pages при push в main — остаётся витриной до M7, потом заменяется `packages/demo`.
