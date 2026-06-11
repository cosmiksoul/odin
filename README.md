# ODIN

Local-first каталог метрик: приносишь Parquet-витрину с агрегатами + `catalog.json` со схемой —
получаешь каталог метрик с графом зависимостей, динамикой, разрезами, алертами и MD-контекстом.
Данные не покидают твою машину.

**Статус:** реанимация (2026-06). Идёт переписывание на TypeScript-монорепо по
[дизайну ODIN 2.0](docs/superpowers/specs/2026-06-11-odin-2.0-design.md).
Старый read-only прототип: [демо на GitHub Pages](https://cosmiksoul.github.io/odin/), ветка `legacy`.

## Структура

- `packages/core` — типы, схемы, валидатор
- `packages/tools` — миграция сида, CLI-валидатор vault
- `vault-demo/` — демо-vault (236 iGaming-метрик)
- `docs/architecture.md` — архитектура; `docs/archive/` — историческая документация
