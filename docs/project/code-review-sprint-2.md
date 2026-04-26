# Code Review — Sprint 2 (Cleanup + Real Data + UX Consistency)

**Дата:** 2026-04-26
**Reviewer:** Cowork
**Sprint report:** `docs/project/sprint-report-2.md`
**Verdict:** ✅ **Approved with one product-decision concern** — пропускаю в TEST PREP / QA. Один из concerns (multi-pin в Graph удалён) — это продуктовое решение Code, требует твоего явного «да» или «вернуть».

---

## Что проверял

- Соответствие задач в отчёте задачам из `sprint-2-prompt.md` (Pass 1: G1+G2+H, Pass 2: A-F)
- Соблюдение секции **DO NOT** (включая новые: не решать scaling Graph 236 нод и Catalog scrollbar)
- Workflow между пассами (Pass 1 коммит сделан пользователем, Pass 2 ждёт ревью — корректно)
- ADR compliance (особенно ADR-007 — JSON как промежуточный шаг)
- Scope creep — что Code сделал сверх запрошенного
- Качество секции **How to test**
- Фактическое состояние через `git status`, `git log`, чтение кода

---

## 🔴 Blockers

**Нет.** Pass 1 уже в коммите (`280baf7`), Pass 2 готов к коммиту, dev-сервер запускается, build собирается (отчёт + sanity).

---

## 🟡 Concerns

### C1. Multi-pin на Graph удалён — продуктовое решение Code, требует твоего явного «да»

**Что:** В prompt'е C было «pinned card в Graph переписать на этот компонент» — это подразумевало **сохранить side-panel** на Graph (раньше там был стек compact-карточек, можно было закрепить N метрик одновременно). Code зафлагал это в Notes как осознанное отступление и предложил **single source of truth**: один Drawer overlay (как в Catalog) при клике на ноду графа. Multi-pin удалён.

**Trade-off (как Code описывает в Notes UX-изменений #1):**
- ✅ Простота: один компонент — одна точка изменения. Меньше кода, меньше мест для рассинхрона
- ✅ Консистентность с Catalog drawer
- ❌ **Потеря функциональности**: раньше можно было запиннить 3-4 метрики side-by-side для сравнения / расследования. Теперь только одна за раз
- ❌ Это product decision Code, не наше с тобой согласование

**Почему concern:** Это **в зоне продуктового решения, не Code'а**. По регламенту Cowork-Onboarding (Калибровка-1: «продуктовая боль из опыта не отменяется»). Multi-pin был фичей в Graph для use case «сравнить 2-3 связанные метрики при расследовании аномалии» — это валидный investigative workflow, не косметика.

**Откуда:** Sprint 2 prompt секция C (Pass 2), отчёт «Pass 2 → C → UX-решение, отличающееся от буквального промпта».

**Решение нужно от тебя:**
- **(a) Принимаем удаление multi-pin.** Single overlay — лучше для нашего ICP. Двигаемся к QA.
- **(b) Возвращаем multi-pin** через fix-cycle. Code в отчёте написал «готов вернуть, если решение не зашло». Это новый Code-проход на час-два.
- **(c) Откладываем решение, в QA проверяешь — оцениваешь нужен ли multi-pin реально.** Прагматично.

Моя рекомендация: **(c)** — потести в QA, посмотри как тебе работается с одной картой. Multi-pin был в прототипе Claude Design «потому что мог», а не «потому что нужен по use case». Если в QA не хватит — fix-cycle. Если ОК — закроем.

---

### C2. `.obsidian/workspace.json` modified — попадёт в коммит как мусор

**Что:** В `git status` есть `modified: .obsidian/workspace.json`. Это **конфиг Obsidian** (твоего vault'а) — где-то ты открыл папку проекта `Projects/odin` как Obsidian-vault, и он создал свою служебную папку `.obsidian/`. При коммите Pass 2 через `git add -A` этот файл попадёт в репо.

**Почему concern:** это **локальный шум**, не часть проекта. Workspace.json меняется каждый раз когда Obsidian обновляет UI-state. Будет постоянно приходить в коммиты как «мусорный noise».

**Решение:** добавить `.obsidian/` в `.gitignore` **до** коммита Pass 2. Я могу сделать это сразу — одна строка. Также в коммите окажется удаление файла `.obsidian/workspace.json` (если он уже в индексе) — проверим.

---

### C3. `ThemeToggle` теперь dead code с broken signature

**Что:** Code в Notes пункт 1 «Pre-existing dead code» отметил: `ThemeToggle({tw, setTweak})` определён в `app.jsx:998`, но после Pass 1 эти props больше не существуют (tw-props chain очищена). Я подтвердил: функция определена, **нигде не вызывается** (`grep ThemeToggle src/app.jsx` показывает только line 998).

**Почему concern:** это безопасно **сейчас** (никто не зовёт), но это **ловушка**. Если кто-то (ты или Code в Sprint 3) попытается восстановить вызов — упадёт runtime. Лучше удалить сейчас (5 строк) чем оставить мину.

**Решение:** удалить `ThemeToggle` функцию в `app.jsx`. Я могу сделать сам в одном edit'е — это 1 строка комментария + сам компонент. Если хочешь — добавлю в Sprint 2 cleanup как мою правку (не Code), Pass 2 коммитится с этим включением.

Альтернатива: оставить, **пометить TODO** комментом «removed in Sprint 2 cleanup». Но это менее чисто.

---

## 🟢 Notes (для следующих спринтов или принять как есть)

### N1. Bundle size warning (582 KB, >500 KB threshold)

Vite предупреждает что main chunk >500 KB. Причина — 236 метрик из JSON (~250 KB) теперь зашиты в bundle. Для прототипа норма. Tech debt для Sprint 3+ если запустим публичную демку:
- Lazy-import seed JSON через `import('default-vault/_seed/...')` — отложенная загрузка
- Code-splitting по route'ам (Catalog / Graph / Saved)

Не блокер.

### N2. Производительность Graph 236 нод не замерена

Code пишет «по наблюдениям при разработке лагов не было». Это эмпирично. **Что проверить в QA:** drag/zoom на Graph при 236 нодах — плавный? Если есть лаги — флаг для Sprint 3 (lazy render at zoom < 0.6 или canvas-based render).

### N3. Dead CSS: `.odin__pinned*`, `.odin__zoom*`, `.odin__tt-lvl/deps`

Классы из старого PinnedCard / floating zoom / старого тултипа не используются после Pass 2. Code оставил по правилу 3 (не удалять pre-existing). Кандидат на снос в Sprint 3 cleanup. Не вредит.

### N4. UX-изменения вне buktal-промпта — оценка

Code сделал три UX-изменения сверх явного prompt'а, **все зафлагал в Notes** (правильное поведение):

1. **Multi-pin Graph удалён** — обсуждается в C1 выше
2. **Breadcrumb prefix `Catalog /` снят** в MetricPreview header — норм, MetricPreview теперь context-agnostic (используется в Catalog и Graph), prefix был бы неверен в Graph-контексте. Принимаю.
3. **Alerts фильтр radio → multi-select Set** — для consistency с остальными фильтрами (все Set-based). Принимаю — раньше radio была отдельной семантикой, теперь логично что можно «red AND yellow одновременно». Это улучшение, не регрессия.

Code сам флагает изменения — это поведение по CLAUDE.md (озвучивай trade-off'ы). Хорошо.

### N5. Канон `sparkPath` / `fakeValue` / `fakeDelta` — выбор обоснован

Код взял версии из app.jsx (более развитые, с salt-параметром, с большим набором веток). Раньше PinnedCard на Graph рендерился беднее. Сейчас Graph hover-tooltip использует те же fake-данные что Catalog cards — данные синхронизированы.

---

## ADR Compliance — проверка

| ADR / правило | Статус |
|---|---|
| **ADR-007 Мунин = MD + git** | ✅ JSON-load (H) явно помечен как промежуточный шаг (отчёт, "When подключим Parquet+DuckDB — заменим на реальные значения"). MD-vertical-slice — Sprint 3+. Архитектура не нарушена. |
| **ADR-008 local-first** | ✅ JSON в bundle = build-time. Никаких runtime cloud-зависимостей. Google Fonts CDN остаётся как было (известный pre-M3 tech debt) |
| **ADR-010, ADR-012, ADR-013** | n/a, не затрагивались |
| **CLAUDE.md Правило 1** (думать до кода, озвучивать trade-off'ы) | ✅ UX-изменения вне scope зафлагованы явно с trade-off'ом и предложением вернуть |
| **CLAUDE.md Правило 2** (минимум кода) | ✅ Никаких новых либ. Структура `src/lib/`, `src/components/` оправдана. |
| **CLAUDE.md Правило 3** (Surgical Changes) | ✅ Pre-existing dead code (`ThemeToggle`, `.odin__pinned*` CSS) оставлен и упомянут. CSS не переписан сверх задачи. |
| **CLAUDE.md Правило 4** (цель-driven) | ✅ Pass 1 sanity check сделан, Pass 2 имеет полный How to test |
| **DO NOT (16 пунктов)** | ✅ TS, Tailwind, новые либы, тесты, ESLint, Electron, MD-файлы, ADR-014, scaling Graph, Catalog scrollbar — ничего не тронуто. Код не делал commit'ов сам. Между Pass'ами явно остановился, дождался «продолжай». |
| **Workflow Pass 1 → Pass 2** | ✅ Pass 1 коммит сделан тобой (`280baf7`), Pass 2 готов и не закоммичен — ждёт твоего ревью. По правилам. |

---

## Decision Log

| Что обсудили | Решение |
|---|---|
| C1 (multi-pin удалён) | **Жду твоего выбора:** (a) ОК / (b) вернуть через fix-cycle / **(c) проверить в QA, потом решить** ← рекомендую |
| C2 (.obsidian/ в коммите) | Cowork добавит `.obsidian/` в `.gitignore` сразу, до коммита Pass 2 |
| C3 (ThemeToggle dead code) | Cowork удалит сразу, до коммита Pass 2 — иначе мина. Если возражаешь — отложим в Sprint 3 cleanup |
| N4 — Breadcrumb prefix снят | Принимаем (MetricPreview context-agnostic) |
| N4 — Alerts multi-select | Принимаем (consistency с остальными фильтрами) |
| N1, N2, N3, N5 | Notes для будущих спринтов / факт без действия |

---

## Что дальше

1. **Cowork** делает 2 точечные правки до коммита Pass 2:
   - `.gitignore` += `.obsidian/`
   - `app.jsx`: удалить `ThemeToggle` функцию (dead code, broken signature)
2. **Cowork** готовит `docs/project/test-cases-sprint-2.md` — тест-кейсы для QA. По феедбеку из памяти Sprint 1 (memory `feedback_test_cases.md`): сначала использую Code's «How to test» как baseline, потом добавлю diagnostic-кейсы для C1 (multi-pin gone) и regression-чек для Pass 1 (236 метрик не отвалились после Pass 2).
3. **Пользователь** ждёт пока Cowork сделает (1) и (2), потом коммитит Pass 2 (`git add -A && git commit`). После коммита — QA.
4. **При успешной QA** → CLOSE Sprint 2: JTBD update, CONTEXT.md timeline, обсуждение Sprint 3 plan (Graph scaling, Catalog scroll, MD vertical slice, Q2.7 ADR)
5. **При фейле QA** (особенно если C1 решил «вернуть multi-pin») — fix-prompt → новый цикл DEV
