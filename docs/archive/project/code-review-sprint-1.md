# Code Review — Sprint 1 (Build Foundation)

**Дата:** 2026-04-25
**Reviewer:** Cowork
**Sprint report:** `docs/project/sprint-report-1.md`
**Verdict:** ✅ **Approved with concerns** — пропускаю в TEST PREP / QA. Concerns не блокируют запуск, но один (контрастный фикс) проверяется в QA визуально и может вернуться в FIX.

---

## Что проверял

- Соответствие задач в отчёте задачам из `sprint-1-prompt.md` (1-8)
- Соблюдение секции **DO NOT** (11 явных запретов)
- ADR compliance (ADR-008, ADR-012, ADR-013, CLAUDE.md правила)
- Scope creep — не сделано ли больше запрошенного
- Качество секции **How to test** для не-разработчика
- Фактическое состояние файлов через `git status` и чтение

---

## 🔴 Blockers

**Нет.** Сборка работает, dev-сервер отвечает, prod-бандл собирается. Можно запускать QA.

---

## 🟡 Concerns

### C1. Контрастный фикс заголовков карточек (задача 8) — root cause не доказан

**Что:** Code изменил `.card__name` с `color: var(--fg)` (`#efefef`) → `var(--l1)` (`#ffffff`) + `font-weight: 600 → 700`. Сам Code в Notes пункт 7 явно отмечает: theoretically `#efefef` на `#0f0f0f` должно читаться, реальная причина может быть в незагрузившемся Google Fonts (моноспейс fallback тонкий).

**Почему concern:** правка трогает **симптом** (контраст цвета), а не **корневую причину** (если она в шрифте). Если у тебя в QA заголовки **всё ещё** плохо читаются после фикса — значит root cause в шрифтах, и нужен отдельный fix-цикл по bundled-шрифтам (пункт 5 в Notes отчёта).

//коментарий N13Z - скорее всего причина была не в цвете как в как в таковом а в неправильном применение CSS к заголовку. Просто прототип был не идеальный. Проверим на этапе теста

**Откуда:** Sprint 1 prompt задача 8, отчёт Notes пункт 7-8.

**Решение:** проверить визуально в QA. Если читается — закрыто. Если нет — Tech Debt #5 (bundled fonts) поднимается в приоритет, делаем отдельный спринт-фикс.

---

### C2. `Catalog.html` — расхождение между отчётом и git состоянием

**Что:** В отчёте секция "Files Deleted" говорит что `src/Catalog.html` удалён. Файл реально удалён из файловой системы (проверял через `head` и `ls -la src/`). Но `git status` показывает его как `modified: src/Catalog.html`, а не `deleted: src/Catalog.html`. Это значит Code удалил файл через `rm` без `git rm`, а git видит инкриминированный delta (был в HEAD, нет в working tree) и помечает странно.

**Почему concern:** при коммите этого спринта если ты сделаешь `git add .` (точка) — удаление **не попадёт** в индекс, файл воскреснет в репозитории. Нужно `git add -A` (или `git add -u`).

**Откуда:** `git status` после спринта.

**Решение:** при первом коммите Sprint 1 использовать `git add -A`. Это норма — не нужен fix от Code.

//ну вообще желательно что бы такое не повторялось. я ненавижу резолвить конфликты в гите

---

## 🟢 Notes (для следующих спринтов / fixed by user)

### N1. `.gitignore` показывается как modified — это не Code

В `git status` `.gitignore` помечен как `modified`, но `git diff` показывает только переход CRLF → LF на всех строках. Это эффект моей рекомендации `git config --global core.autocrlf true` — git нормализует line endings при первом checkout. Сам контент не изменился. Code здесь ни при чём, прокатится с первым коммитом.

### N2. `.claude/settings.local.json` — добавить в .gitignore

Появился новый локальный файл `.claude/settings.local.json` (479 байт). В текущем `.gitignore` есть `.claude/projects/` и `.claude/cache/`, но не сам `settings.local.json`. Стоит добавить строку `.claude/settings.local.json` в `.gitignore` — иначе локальные настройки твоей машины уйдут в репо. Я обновлю `.gitignore` сам, если согласен.

### N3. Отчёт хорошо документирует tech debt

Отчёт правильно зафлагал и **не стал чинить**:

- **Tech debt #1:** дубликат функции `cx` в `graph-view.jsx` (compromise для избежания circular import — норм, до появления `lib/util.js`)
- **Tech debt #2:** дубликаты `gSparkPath`/`gFakeValue`/`gFakeDelta` в `graph-view.jsx` vs `app.jsx`
- **Tech debt #4:** инлайн `__TWEAKS_STYLE` в `tweaks-panel.jsx` — кандидат на вынос в CSS
- **Tech debt #5:** `@import url('https://fonts.googleapis.com/...')` в `styles.css` — будущее **нарушение ADR-008** при упаковке в Electron (cloud-зависимость в runtime). Не блокер для Vite-прототипа, но обязательно фиксить до M3.

//на всякий случай напомню - у нас был ПРОТОТИП интерфейса. Херовый интерактивны прототип. Как 

Эти пункты надо занести в JTBD под `[M-EDIT]` или новый под-милестоун M1-cleanup. Сделаю в фазе CLOSE Sprint 1.

### N4. `import React from 'react'` в `tweaks-panel.jsx` + `React.useState` стиль

Code добавил default-импорт React и оставил вызовы `React.useState`/`React.useEffect`/`React.useCallback`/`React.useRef` (вместо `import { useState, ... } from 'react'`). Стилистически в проекте используется второй стиль (в `app.jsx`, `graph-view.jsx`). Можно унифицировать в следующем спринте, но **это стилистика, не дефект** — функционально оба варианта корректны. Не делаем сейчас (Калибровка 5 Cowork-Onboarding).

---

## ADR Compliance — проверка

| ADR / правило                                                                     | Статус                                                                                                                |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **ADR-008 local-first** (нет cloud-зависимостей в build / runtime основного пути) | ✅ build-time. ⚠️ runtime: Google Fonts CDN — будущее нарушение для Electron, см. N3                                   |
| **ADR-010, ADR-012, ADR-013**                                                     | n/a, не затрагивались                                                                                                 |
| **CLAUDE.md Правило 1** (думать до кода, озвучивать trade-off'ы)                  | ✅ Notes отлично разобраны                                                                                             |
| **CLAUDE.md Правило 2** (минимум кода)                                            | ✅ ничего лишнего, без новых либ                                                                                       |
| **CLAUDE.md Правило 3** (Surgical Changes)                                        | ✅ один селектор CSS, рефакторинг только синтаксиса импортов                                                           |
| **CLAUDE.md Правило 4** (цель-driven)                                             | ✅ sanity checks с конкретными пунктами                                                                                |
| **DO NOT (11 пунктов)**                                                           | ✅ все соблюдены: нет TS, Tailwind, новых либ, тестов, ESLint, не трогал `default-vault/_seed/`, не делал commit в git |

---

## Decision Log

| Что обсудили | Решение |
|---|---|
| C1 (контрастный фикс) | В QA. Если визуально не читается — fix-cycle с bundled-fonts |
| C2 (Catalog.html в git status) | При коммите `git add -A` — не fix Code |
| N2 (`.claude/settings.local.json`) | Cowork обновит `.gitignore` сразу после approve этого review |
| N3 (tech debt пункты) | Cowork занесёт в JTBD на фазе CLOSE Sprint 1 |
| N4 (стиль `React.useState`) | Не фиксим, не дефект |

---

## Что дальше

1. **Cowork:** обновляет `.gitignore` (`+ .claude/settings.local.json`)
2. **Cowork:** готовит `docs/project/test-cases-sprint-1.md` — формальные тест-кейсы для QA (помимо `How to test` от Code)
3. **Пользователь:** делает QA по `How to test` инструкции из отчёта + тест-кейсы от Cowork
4. **При успешной QA:** фаза CLOSE — Cowork обновляет JTBD (`[x]` для Sprint 1 задач), `CONTEXT.md` (Timeline), заносит N3 tech debt пункты как новые stories
5. **При фейле QA (особенно C1):** fix-prompt → новый цикл DEV
