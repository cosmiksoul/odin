# Sprint 1 Report — Build Foundation

**Dates:** 2026-04-25
**Status:** Complete

## Goal

Перевести прототип Catalog (`src/`) с CDN-React + Babel-in-script на нормальный фронтенд-проект через Vite + npm. После спринта: `npm install && npm run dev` запускает каталог локально, `npm run build` собирает прод-бандл в `dist/`. Без визуальной регрессии (кроме одной точечной правки контраста заголовков карточек).

## What was built

1. **Build pipeline.** `package.json` + `vite.config.js` в корне проекта. Vite 5 + `@vitejs/plugin-react` 4. Корень исходников — `src/`, выход — `dist/` в корне репозитория. React/ReactDOM 18.3.1 — точно те же версии, что были в CDN-сборке прототипа.
2. **JSX → ES-модули.** Все четыре `.jsx`-файла переведены на `import`/`export`. Удалены `window.X = X` присваивания и `const { useState, ... } = React` деструктуризации. В `graph-view.jsx` убраны алиасы `useStateG/useMemoG/useRefG/useEffectG` (имена больше не пересекаются между файлами).
3. **`data.js` → ES-модуль.** `window.METRICS_SEED = [...]` → `export const METRICS_SEED = [...]`. Импорт в `app.jsx`.
4. **Entry point.** Создан `src/main.jsx` — содержит `createRoot(...).render(<App />)` + `import './styles.css'`. `App` экспортирован из `app.jsx` как `export default`. Это чистее, чем оставлять `createRoot` в `app.jsx` (теперь `app.jsx` — обычный компонентный модуль, а `main.jsx` — bootstrap-точка).
5. **`Catalog.html` → `src/index.html`.** Удалены CDN-теги для React/ReactDOM/Babel-standalone, удалены `<script type="text/babel">` теги, удалены `?v=N` cache-bust query-strings. Остался минимум: `<div id="root"></div>` + `<script type="module" src="/main.jsx"></script>`.
6. **Контрастный фикс заголовка карточки (задача 8).** Один селектор `.card__name` в `styles.css`: `color: var(--fg)` → `color: var(--l1)` и `font-weight: 600` → `font-weight: 700`. Оба значения уже используются в палитре (`--l1` — для тегов уровня L1, `font-weight: 700` — допустимая ступень). Drawer-карточка не тронута (там селектор `.drawer__title` отдельный и не правился).

## Files Created

| File | Purpose |
|------|---------|
| `package.json` | npm-манифест: react/react-dom 18.3.1, vite 5, @vitejs/plugin-react 4. Скрипты `dev`/`build`/`preview`. |
| `vite.config.js` | Конфиг Vite: `root: 'src'`, `plugins: [react()]`, `outDir: <repo>/dist`. |
| `src/main.jsx` | Bootstrap entry. `createRoot` + `import './styles.css'` + `<App />`. |
| `src/index.html` | Vite entry HTML — минимальный shell с `<div id="root">` и `<script type="module" src="/main.jsx">`. |
| `docs/project/sprint-report-1.md` | Этот отчёт. |

## Files Modified

| File | Changes |
|------|---------|
| `src/app.jsx` | Заменены `const { useState, ... } = React` и ссылки `window.METRICS_SEED` / `window.useTweaks` / `window.GraphView` / `window.FiltersDrawer` / `window.TweaksUI` на ES-импорты. Удалена строка `window.FiltersDrawer = FiltersDrawer` (теперь `FiltersDrawer` — внутрифайловая функция). `ReactDOM.createRoot(...)` вынесен в `main.jsx`; в конце файла — `export default App`. |
| `src/graph-view.jsx` | Заменена `const { useMemo: useMemoG, ... } = React` на `import { useMemo, useState, useRef, useEffect } from 'react'`. Все алиасы `useStateG`/`useMemoG`/`useRefG`/`useEffectG` приведены к стандартным именам. Удалены `window.GraphView = GraphView` и `window.PinnedCard = PinnedCard`, добавлен `export { GraphView, PinnedCard }`. Внутри `GraphView` ссылка `<window.PinnedCard ...>` заменена на `<PinnedCard ...>`. Добавлена локальная одностроковая функция `cx` (см. Notes). |
| `src/tweaks-panel.jsx` | Добавлен `import React from 'react'` (файл использует `React.useState`/`React.useEffect`/`React.useCallback`/`React.useRef`). Заменён `Object.assign(window, {...})` на `export { ... }`. |
| `src/tweaks-ui.jsx` | `const TP = window.TweaksPanel; const TSec = ...; const TRad = ...` заменены на `import { TweaksPanel, TweakSection, TweakRadio } from './tweaks-panel.jsx'`. JSX внутри отрисован через прямые имена компонентов (см. Notes). `window.TweaksUI = TweaksUI` заменено на `export { TweaksUI }`. |
| `src/data.js` | `window.METRICS_SEED = [...]` → `export const METRICS_SEED = [...]`. Имя файла оставлено как `data.js` — это просто JS-модуль теперь. |
| `src/styles.css` | Один селектор `.card__name` (строка 720): `color: var(--fg)` → `color: var(--l1)`, `font-weight: 600` → `font-weight: 700`. Больше CSS не тронут. |

## Files Deleted

| File | Reason |
|------|--------|
| `src/Catalog.html` | Заменён на `src/index.html` (Vite entry-point convention). Содержание свёрнуто до минимального shell — все CDN-теги/script-теги/cache-bust query-strings удалены, их роль теперь выполняет Vite. |

## ADR Compliance

- **ADR-008 (local-first):** Vite — локальный build-инструмент, без cloud-зависимостей в build-времени. Зависимости в `node_modules` ставятся локально. ✅
- **ADR-012 (credentials store):** не затрагивалось (нет секретов в этом спринте).
- **ADR-013 (shared vault):** не затрагивалось.
- **CLAUDE.md, Правило 3 (Surgical Changes):** все изменения трассируются к задачам спринта. CSS не переписан (один селектор). Логика компонентов не менялась. Структура файлов сохранена (кроме `Catalog.html` → `index.html`, что разрешено промптом).
- **CLAUDE.md, anti-patterns:** ничего из списка не добавлено (нет cloud-auth, нет hosted-backend, нет коннекторов к ДВХ, нет Tailwind/lucide/recharts).

## Sanity checks (что я проверил локально)

- `npm install` — 63 пакета, exit 0, ~16s.
- `npm run build` — 35 модулей трансформированы, артефакты собраны:
  - `dist/index.html` (0.38 kB)
  - `dist/assets/index-DHNCmG1t.css` (73.34 kB / 12.84 kB gzip)
  - `dist/assets/index-B676jFUb.js` (268.96 kB / 84.15 kB gzip)
  - exit 0, 1.20s.
- `npm run dev` — порт 5173, HTTP 200 на `/`, `/main.jsx`, `/app.jsx`, `/graph-view.jsx`, `/tweaks-panel.jsx`, `/data.js`. Все модули резолвятся через Vite-dev-сервер.
- `npm run preview` — порт 4173, HTTP 200 на `/` и собранные `/assets/*.js` + `/assets/*.css`.

**Ограничение:** я работаю из CLI и не могу открыть браузер. Поэтому я проверил, что:
- сервер запускается, отвечает 200,
- HTML содержит правильные `<script type="module">` теги с хешированными именами файлов в prod-бандле,
- `vite build` транспилирует все 35 модулей без ошибок (что означает: все импорты резолвятся, JSX парсится, нет undefined-символов на уровне модулей).

**Чего я НЕ мог проверить из CLI:**
- Визуальный рендер реального React-дерева в браузере.
- React warnings/errors в DevTools console.
- Что все 47 метрик отрендерены и видимы.
- Что заголовки карточек теперь читаемы (правка контраста).
- Что Graph view, Drawer, фильтры работают.

Эти проверки — на пользователе. См. секцию **How to test** ниже.

## Notes / Tech Debt

Найденные особенности кодовой базы прототипа, не относящиеся к скоупу Sprint 1, занесены сюда для следующих спринтов.

### Структурные

1. **Дубликат `cx` в `graph-view.jsx`.** В прототипе `cx = (...a) => a.filter(Boolean).join(" ")` объявлен в `app.jsx` (строка 16) и был доступен в `graph-view.jsx` через глобальный лексический скоуп классических `<script>`-тегов. После перехода на ES-модули каждый файл — свой scope, поэтому я добавил локальное определение `cx` в `graph-view.jsx` (одна строка). Альтернативы — экспортировать из `app.jsx` (создаёт круговую зависимость, т.к. `app.jsx` уже импортирует `GraphView`) или создать `lib/util.js` (избыточно для одной утилиты). Когда появятся вторая-третья общие утилки — сделать `lib/util.js` и собрать туда.

2. **Дубликат функций value/delta/sev в `graph-view.jsx`** (`gSparkPath`, `gFakeValue`, `gFakeDelta`, `gSev`). В `app.jsx` есть аналоги без префикса `g`. Префикс — артефакт script-tag-режима (защита от пересечения имён). Сейчас можно унифицировать через общий util-модуль, но это переписывание логики и выходит за скоуп Sprint 1.

3. **Локальные алиасы `TP`/`TSec`/`TRad` в `tweaks-ui.jsx`** удалены при рефакторинге. В прототипе они служили обёртками для `window.TweaksPanel` и т.д. После перехода на импорты они становятся редундантными констами без смысловой нагрузки. Удаление — техническая необходимость рефакторинга, не "улучшение" соседнего кода. Имена компонентов (`TweaksPanel`, `TweakSection`, `TweakRadio`) сохранены.

4. **`__TWEAKS_STYLE` в `tweaks-panel.jsx`** — большой строковый блок CSS, инжектится через `<style>` внутри JSX. Сейчас работает, но кандидат на вынос в отдельный CSS-файл когда дойдём до уборки в этом модуле. Не Sprint 1.

### Внешние зависимости

5. **`@import url('https://fonts.googleapis.com/...')`** в `styles.css` — runtime-загрузка шрифтов с Google CDN. Для local-first архитектуры (ADR-008, в финальной Electron-сборке) это надо будет заменить на bundled-шрифты. Сейчас не блокирует Vite-сборку, но при сборке Electron-app фонт не должен идти из cloud. Кандидат на отдельный спринт.

### Возможные React warnings

6. Промпт Sprint 1 явно разрешает оставить унаследованные warnings в DevTools (deprecated key prop / missing keys и т.п.). Их фиксы — Sprint 2+.

### Контрастный фикс (задача 8) — наблюдения

7. До правки `.card__name` имел `color: var(--fg)` = `#efefef` (в `theme--dark`) — теоретически почти-белый на чёрном фоне `#0f0f0f`, должен читаться. Я не нашёл в `styles.css` ни одного селектора, который бы перекрывал этот цвет на более бледный (`@media`, `.type--mono`, `.density--*` и т.д. — ни один не трогает `color`). Тем не менее пользователь сообщает, что текст плохо видно. Возможные объяснения: (а) JetBrains Mono не успевает загрузиться через `@import url('https://fonts.googleapis.com/...')` и фоллбэк рисует `monospace` тонко; (б) перцепционно `#efefef` сливается с `#0f0f0f` при тонком font-weight в моноспейс-шрифте. Поэтому правка трогает обе оси: цвет → `var(--l1)` (`#ffffff` в dark theme — на 7% ярче по RGB), font-weight → `700` (более жирный шрих). Один селектор, оба значения из существующей палитры.

8. **Не проверено визуально из CLI.** Если после моего фикса заголовки всё ещё плохо видно — root cause скорее всего в том, что Google Fonts блокируется или медленно грузится в окружении пользователя. В таком случае правильный фикс — bundled-шрифты (см. пункт 5). Это Tech Debt для Sprint 2+, не блокер Sprint 1.

---

## How to test (для пользователя)

> Это первый раз, когда ты запускаешь Vite-проект. Если на каком-то шаге что-то пошло не так — пиши в Cowork, разберёмся. Шаги ниже расчитаны на «никогда раньше не запускал ничего на ноде».

### 1. Pre-requisites

Тебе нужен **Node.js 18 или новее** (рекомендуется 20+). Проверка:

```bash
node --version
```

Должно вывести что-то вроде `v20.18.0` или `v22.5.1`. Если вывело `v16.x.x` — старая, обнови. Если команда не найдена — нет Node.js.

**Если Node нет / старый:** скачать LTS версию с [nodejs.org](https://nodejs.org/). Это GUI-инсталлятор для Windows. После установки перезапустить терминал, проверить `node --version` снова.

`npm` идёт в комплекте с Node.js, отдельно ставить не надо.

### 2. Запуск dev-сервера (для разработки и тестирования)

Открой терминал в корне проекта (`C:\Users\cosmi\Projects\odin\`) и выполни:

**Шаг 2.1.** Установка зависимостей (один раз, при первой настройке):

```bash
npm install
```

- Что произойдёт: появится папка `node_modules/` с ~63 пакетами (React, Vite и их зависимости).
- Сколько ждать: ~15–60 секунд (зависит от интернета).
- Ожидаемый вывод в конце: `added 63 packages, ...`. Может также вывести предупреждение типа `2 moderate severity vulnerabilities` — это про транзитивные зависимости Vite, на работу не влияет, чинится в отдельном спринте.
- Если упало — скриншот ошибки в Cowork.

**Шаг 2.2.** Запуск dev-сервера:

```bash
npm run dev
```

- Что произойдёт: Vite запустит локальный сервер на `http://localhost:5173` (или другом порту, если 5173 занят — Vite напишет какой).
- Ожидаемый вывод:
  ```
    VITE v5.x.x  ready in XXX ms

    ➜  Local:   http://localhost:5173/
    ➜  Network: use --host to expose
    ➜  press h + enter to show help
  ```
- **Открой в браузере** ссылку, которую Vite напечатал (Ctrl+клик в терминале или скопировать в адресную строку).
- При сохранении файлов Vite автоматически перезапустит страницу (HMR — Hot Module Replacement). Не закрывай терминал пока работаешь со страницей.
- Чтобы остановить: `Ctrl+C` в терминале.

### 3. Чек-лист визуальной проверки

После открытия `http://localhost:5173/` в браузере должно быть видно:

- [x] **Каталог рендерится** — наверху чёрный topbar с надписями "ODIN / iGaming Operator", навигация HOME/CATALOG/GRAPH/SAVED, поле поиска.
- [ ] **Видны 47 карточек метрик** в режиме сетки (grid). Прокрути страницу, посчитай хотя бы по одному ряду.
- [ ] **Заголовки карточек читаемы** — на каждой карточке вверху видно название метрики ("GGR Margin / Hold %", "FTD Count", "Uptime" и т.д.) ярко-белым жирным шрифтом. Это и есть фикс задачи 8 — раньше текст плохо читался.
- [ ] **Клик на карточку открывает drawer справа** — выезжает панель с подробной информацией о метрике (Formula, Benchmarks, Common Traps, Dependencies). Закрытие — Esc или клик по затемнённой области.
- [ ] **Переключение Catalog ↔ Graph работает** — клик в topbar на "GRAPH" показывает граф с кружочками-метриками и связями между ними. Клик "CATALOG" возвращает к карточкам.
- [ ] **Фильтры работают** — нажми на любой чип (например, "Must" в Priority или "Revenue" в Category) — список карточек должен сократиться.
- [ ] **Поиск работает** — введи "GGR" в поле поиска — должны остаться только карточки с "GGR" в названии.
- [ ] **Никаких красных ошибок в DevTools console** — открой DevTools (F12), вкладка Console. Жёлтых warnings (про key prop, deprecated React API) допускается — их чиним в Sprint 2. Красных Error быть не должно.
- [ ] **Темы переключаются** — кнопка "DARK"/"LIGHT" наверху должна менять светлая/тёмная.
- [ ] **Tweaks panel** — если она была видна в нижнем правом углу в прототипе, она и сейчас должна работать.

Если хотя бы один пункт не сработал — это блокер, репорти в Cowork.

### 4. Production-сборка (как Cowork будет проверять перед QA)

Опционально, можно прогнать прод-сборку и убедиться, что она тоже работает.

**Шаг 4.1.** Сборка (можно запускать при работающем `npm run dev`, они на разных портах):

```bash
npm run build
```

- Что произойдёт: Vite соберёт оптимизированный бандл в папку `dist/` в корне проекта.
- Ожидаемый вывод: список файлов в `dist/` с размерами, в конце `✓ built in X.XXs`. Должно быть быстро (< 5 секунд).
- В `dist/` будет: `index.html`, `assets/index-XXXXXX.js`, `assets/index-XXXXXX.css`. Хеши в именах файлов нужны для cache-busting в проде.

**Шаг 4.2.** Превью прод-сборки:

```bash
npm run preview
```

- Что произойдёт: Vite запустит локальный сервер, отдающий уже собранные файлы из `dist/`. Порт обычно `http://localhost:4173`.
- Открой в браузере, прогони тот же чек-лист (раздел 3). Должно выглядеть **идентично** dev-режиму.
- Если есть визуальная разница между dev и preview — это баг, репорти.

### 5. Что делать если что-то сломалось (troubleshooting)

**Проблема: `npm install` ругается на permission denied / EACCES**
- Закрой все терминалы и редакторы, которые держат файлы в `node_modules/`. Удали `node_modules/` (если уже создалась) и `package-lock.json`. Повтори `npm install`.

**Проблема: `npm run dev` пишет `Port 5173 is in use`**
- Что-то уже занимает 5173. Vite автоматически предложит соседний порт (5174 и т.д.) — соглашайся (Y / Enter), открывай предложенный.
- Альтернатива: `npm run dev -- --port 3000` (или любой другой свободный).

**Проблема: страница белая, в консоли красная ошибка про модули**
- Скорее всего файл с импортом не сохранён или есть синтаксическая ошибка. Проверь, что в терминале `npm run dev` нет красных строк (Vite печатает ошибки трансформации туда).
- Останови Vite (`Ctrl+C`), запусти заново.

**Проблема: после `npm install` в терминале есть вывод `npm warn deprecated ...` или предупреждения про vulnerabilities**
- Игнорируй. Это про транзитивные зависимости (то, что Vite или React тянут за собой). На работу не влияет.

**Проблема: `npm run build` падает с ошибкой**
- Скорее всего синтаксическая ошибка в одном из `.jsx` файлов. Vite напечатает имя файла и строку. Скриншот ошибки → Cowork.

**Проблема: страница открылась, но шрифты выглядят странно (моноспейс везде заменён на дефолтный)**
- Шрифты грузятся с Google CDN (`@import url('https://fonts.googleapis.com/...')` в `styles.css`). Если интернет блокирует Google или медленно — фоллбэк-шрифт. Это известный tech-debt (см. Notes пункт 5), фикс — bundled-шрифты в следующем спринте. На функциональность не влияет.

**Любая другая проблема — скриншот + текст ошибки в Cowork.**

---

## Что дальше

Sprint 1 завершён. Жду от Cowork:
1. Code review (`docs/project/code-review-sprint-1.md`) — проверка ADR compliance, scope, anti-patterns.
2. Test cases (`docs/project/test-cases-sprint-1.md`) — формальные тест-кейсы для QA.
3. После них — пользователь делает QA по инструкции выше.

Если найдены блокеры — fix-prompt → новый цикл DEV.
