---
created: '2026-04-24'
part-of: Odin/README
tags:
  - odin
  - roadmap
  - planning
---
# 03 · Roadmap

> ⚠ **Важно:** roadmap пересмотрен после ADR-008 (local-first), ADR-010 (push-based интеграция), ADR-011 (in-app WYSIWYG-редактор). Прежний план "v0.1 → v0.2 → v0.3 = три публикации" больше не актуален. Новый план — целостный MVP с возможным разбиением на внутренние milestones, без жёстких ETA, с публикацией когда автор сам решит.

> ⚠ **С учётом C-решения (open-questions.md про связь milestones и спринтов):** milestones M1-M9 — это **виртуальные метки** в backlog, а не дисциплинирующие границы спринтов. Конкретный план фич и порядок их реализации живёт в `<project>/docs/JTBD-full-scope.md` (управляется Cowork-инстансом).

## Философия

**Не оптимизируем под скорую публикацию.** Автор готов пилить полгода вечерами до состояния "не стыдно показать". Целостность важнее скорости.

**Целевой MVP — целостный продукт для аналитиков**, который аналитик может реально использовать без знания git/MD/CLI. Demo-сценарий 3 (Хугин) — один из ключевых для финального видео, но не единственная цель. См. decisions-log.md ADR-011.

**Артефакты на выходе MVP:**
- Локальная Electron-app, работающая на ноутбуке автора и любого пользователя
- 236 метрик в MD-файлах с богатыми спеками
- **In-app WYSIWYG-редактор** для правки спек и anomaly-заметок (см. ADR-011)
- **History UI** в карточке метрики (просмотр изменений, rollback)
- **Credentials store** — OS-native secret store для S3, API-токенов, git tokens (см. ADR-012)
- **Опциональный git remote sync** — manual push/pull для shared vault команды (см. ADR-013, Этап 1)
- Локальная БД с синтетическими данными по 3-5 сценариям
- 3-5 ручно написанных anomaly-заметок (контент-работа, не код)
- MCP-сервер Хугин с инструментами
- Поддержка Ollama (локальная LLM) и Claude Desktop как опций
- Demo-видео 90 секунд с прохождением Хугин-сценария
- Документация: README, Munin Sync Contract, инструкции установки, гайд по подключению git remote

## Внутренние milestones (без жёстких ETA)

### M1 — Закрытие UX-долгов текущего прототипа Catalog

Прототип от Claude Design в целом готов как **первый кирпич**. Нужно довести до состояния "не стыдно как база":
- Q-UX.1 Консистентность Graph vs Catalog
- Q-UX.2 Bulk export при разных размерностях
- Q-UX.4 Мелкие баги интерфейса (список TBD)

После этого — оставляем как стабильную базу, **не публикуем отдельно**.

### M2 — Миграция в MD-архитектуру (seed data → vault)

- Финальная схема frontmatter (закрыть open-questions.md Q2.7)
- Финальная схема anomaly-заметок (Q2.8) — включая обязательное поле `created_by` (для будущего RBAC из ADR-013)
- **Скрипт миграции** `scripts/migrate_seed_to_md.py`:
  - Читает `default-vault/_seed/igaming_metrics.json` (откуда берётся — см. architecture.md "Seed data")
  - Генерирует 236 MD-файлов в `default-vault/metrics/<metric_id>/spec.md` с YAML-frontmatter + body
  - Расставляет wiki-links для зависимостей метрик (`[[GGR]]`)
  - Делает первый git commit "Initial seed: 236 iGaming metrics"
- UI начинает читать MD вместо JSON
- Базовый MD-рендер в карточке метрики (без WYSIWYG — это в M-EDIT)

### M3 — Electron-обёртка

- Решить: Electron или Tauri (не блокирующий вопрос, можно начать с Electron — у автора есть знакомство через Obsidian)
- main.js (~50 строк), electron-builder для упаковки
- File system API для чтения vault'а (а не fetch как раньше)
- Запуск приложения как одна иконка
- Базовый dev workflow: `npm run dev` запускает Electron в dev-режиме

### M4 — Munin values: DuckDB + синтетика

- Финализация схемы master-view (закрыть munin-master-view.md Q1-Q4)
- Python-скрипт генерации синтетики
- 3-5 сценарных датасетов (см. ADR-005):
  - Bonus abuse в Бразилии (FTD↑, GGR Margin↓, Bonus Cost↑)
  - Tech инцидент (Uptime↓, Deposit Success↓, FTD↓)
  - Смена игрового микса (Hold%↓, Retention↑, GGR↑)
- DuckDB embedded в Electron-app
- Карточки метрик показывают current value, тренды, WoW/MoM

### M5 — Sync mechanism + Munin Sync Contract

- Финализация спецификации munin-sync-contract.md
- Реализация двух sync-методов: manual import через UI + watch local folder
- Валидатор Parquet с понятными ошибками
- Документация для data-инженеров (как построить витрину)

### M-CRED — Credentials store (ADR-012)

**Параллельно с M5 / перед M-SYNC.** Без credentials store нельзя ни sync с приватного S3, ни git remote с PAT.

- Интеграция `keytar` library
- Settings → Credentials UI (просмотр / добавление / удаление)
- Service name "ODIN", semantic account names (`aws.s3.<bucket>.access_key`, etc)
- Linux fallback (encrypted file + master password) если secret-tool недоступен
- Документация про OS-native secret store

### M-SYNC — Vault sync через git remote (ADR-013, Этап 1)

**В MVP — только Этап 1:** single-user + manual push/pull, без conflict UI и RBAC.

- UI для подключения git remote (URL, выбор credentials)
- Кнопки manual push / pull в Settings → Vault sync
- Auto-pull при старте (опция)
- Auto-push при save (опция, default off)
- Понятное сообщение при git-конфликте + ссылка "как разрешить" (документация)
- `created_by` в frontmatter anomaly-заметок (архитектурный hint для будущего RBAC)
- **Что в MVP не делаем:** UI разрешения конфликтов, real-time sync, multi-user awareness, RBAC, auto-write Хугина в vault

### M-EDIT — In-app WYSIWYG-редактор и history UI (см. ADR-011)

**Это критичный milestone для MVP.** Без него ODIN не для аналитиков.

**WYSIWYG-редактор:**
- Кнопка "Edit" в карточке метрики
- Frontmatter поля как формочки (typed inputs)
- Body как rich-text (TipTap / Lexical / ProseMirror — выбор отложен до старта)
- Save → MD-файл + локальный git commit с автогенерируемым сообщением
- Индикатор статуса сохранения

**History UI:**
- Кнопка "History" в карточке
- Список версий с человеческими сообщениями
- Diff в human-readable виде, не raw `+/-`
- Rollback = новый коммит, не `git reset`

**Что в UX скрыто:** git, ветки, коммиты, merge, push.

**Открытые вопросы перед стартом:**
- Финализация frontmatter-схемы (Q2.7) — критично для typed-fields в редакторе
- Выбор библиотеки (TipTap vs Lexical vs ProseMirror)
- Правила автогенерации commit messages по diff
- UI для разрешения конфликтов (для случая если пользователь правил MD снаружи)

**Может быть разделён на под-спринты:** базовый WYSIWYG → history view → rollback → diff renderer.

### M6 — Anomaly-заметки (контент-работа)

**Это не код, это пишется руками.** Самая уникальная часть проекта — личный опыт автора.

- 3-5 хороших anomaly.md в разных метриках с богатым контекстом:
  - Что произошло (метрика, разрезы, период, severity)
  - Что выяснилось при расследовании
  - Какие ловушки сработали
  - Как починили
- Связи с spec.md через wiki-links

Эти заметки — то, что Хугин будет "вспоминать" в demo-сценарии. Без них demo пустое.

### M7 — Хугин (MCP-сервер)

- Решить Node.js vs Python (Q3.1)
- Базовый MCP-сервер с 8-9 инструментами (см. architecture.md)
- Запуск как child process Electron
- Интеграция с локальной DuckDB и MD-файлами
- Документация подключения к Claude Desktop

### M8 — LLM integration: Ollama + Claude Desktop

- Поддержка Ollama (localhost:11434) как default
- Поддержка Claude Desktop через MCP
- Опционально: OpenAI-compatible endpoint (LM Studio, vLLM)
- UI для выбора model provider в настройках
- Тестирование demo-сценария с локальной моделью (Qwen 14B / Llama 3.1)

### M9 — Demo-видео и публикация

- 90-секундное видео с прохождением сценария 3
- README, About, Munin Sync Contract docs
- GitHub Releases с .dmg / .exe / .AppImage
- Решение о публикации (LinkedIn / Telegram / GitHub)

## Возможные публикации до полного MVP

Автор может **по желанию** опубликовать отдельные milestones как тизеры. Не обязательно, но опция:

- **После M1+M2:** "Сделал MD-based metric catalog с 236 метриками iGaming. Open-source semantic layer." Минимальный read-only сайт через GitHub Pages (build из MD), без Electron — отдельный артефакт. Как лёгкая разогревающая публикация.
- **После M4:** Промежуточный пост "ODIN local-first BI с DuckDB. Вот синтетические сценарии."
- **Полный MVP (M9):** "ODIN — privacy-first BI с локальной LLM. Demo-видео внутри."

**Решение принимается на ходу**, в зависимости от темпа работы и желания.

## Out of MVP scope

Явно **не делаем** в MVP:

- **Cloud OAuth для самой apки** — нет "Login with Google" / SaaS-аккаунтов. См. ADR-008.
- **Hosted backend** — нет Vercel/Railway/Fly.io как обязательной инфраструктуры. См. ADR-008.
- **Pull-based коннекторы к ДВХ** — только push-based через витрину. См. ADR-010.
- **Auto-write Хугина в shared vault** — в MVP только "Save as anomaly note" по кнопке. См. ADR-013, Этап 3.
- **UI разрешения git-конфликтов** — fallback на git CLI. См. ADR-013, Этап 2.
- **RBAC** (видимость метрик по ролям) — но `created_by` записываем в anomaly уже сейчас как архитектурный hint. См. ADR-013, Этап 3.
- **Real-time sync** (как Obsidian Sync) — только manual push/pull + auto-pull при старте.
- **Реальные данные реального оператора** — синтетика для демо.
- **Часовая гранулярность** — дневная.
- **3D-разрезы (geo × product × segment)** — 1D + 2D хватит.
- **Внешние источники (regulatory, stocks)** — это другой проект из 00-Ideas.
- **Multi-vault** — один vault на пользователя.

## Потенциальные post-MVP идеи (список, не обязательство)

- **Автогенерация anomaly-заметок Хугиным** при обнаружении паттернов
- **Multi-vault metrics:** импорт других open-source справочников (e-commerce, SaaS)
- **Custom metrics:** пользователь добавляет свои метрики через UI (создание метрики с нуля, не редактирование существующей)
- **Embedding search:** "найди метрики про retention" → semantic search
- **Alerting via webhook:** Хугин триггерит Slack/email при breach
- **Multi-user** через cloud git remote (push/pull, конфликты)
- **Публичная read-only демка** (через GitHub Pages) для рекрутёров — отдельный билд без Electron, без редактора, для "показать в браузере"

## Риски и митигации

**Риск 1: выгорание на M3-M4 или M7.** Pet-проекты умирают на 2-м месяце.
Митигация: каждый milestone самодостаточен. Прототип Catalog после M1 уже валидный артефакт. Можно остановиться и иметь что-то.

**Риск 2: скоуп-крип.** Добавить "ещё одну мелочь" в каждый milestone.
Митигация: фиксация скоупа в этой заметке + явный список out-of-scope.

**Риск 3: M6 (anomaly-заметки) застопорит проект.** Контент-работа сложнее технической.
Митигация: 3-5 заметок — посильно. Можно начать раньше M7 параллельно с другими milestones, не оставлять на конец.

**Риск 4: некорректная атрибуция источника.**
Митигация: см. decisions-log.md ADR-006.

**Риск 5: локальная LLM окажется слишком слабой для demo-сценария.**
Митигация: dual-mode — основное демо записываем на сильной модели (Claude через MCP) с подписью "пример работы с Claude", дополнительное демо — на Ollama с подписью "то же самое полностью локально, чуть медленнее, чуть проще ответы".

**Риск 6: M-EDIT (WYSIWYG + history) разрастётся в скоупе.** Это самостоятельный нетривиальный продукт.
Митигация: разбиение на под-спринты (базовый редактор → history view → rollback → diff renderer). Каждый под-спринт самодостаточен. Если время поджимает — basic editor + minimal history можно сделать как "good enough", полировать дальше.
