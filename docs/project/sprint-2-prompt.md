# Sprint 2 — Cleanup + Real Data + UX Consistency

## Overview

Двух-проходный спринт по прототипу Catalog. **Цель** — убрать рудимент Claude Design (tweaks-panel + tw-props chain), подцепить реальные 236 метрик из seed JSON, и закрыть UX-долги по консистентности контролов/фильтров/preview между Catalog и Graph view + правки Graph (правильная семантика L1/L2/L3, постоянные подписи нод, читаемый тултип).

**Порядок работы — два прохода с интерактивной паузой между ними:**

- **Pass 1: Cleanup + Real Data** (G + H) — фундамент
- ⏸ **Пауза:** Code останавливается, говорит пользователю «Pass 1 готов, закоммить и потести 3 пункта». Пользователь делает `git add -A && git commit`, запускает `npm run dev`, проверяет sanity (236 метрик / нет tweaks-panel / нет красных Error в console). Возвращается с «продолжай» или «стоп, проблема X».
- **Pass 2: UX Consistency** (A + B + C + D + E + F) — после подтверждения от пользователя
- ⏸ **Финальная остановка:** Code говорит «Pass 2 готов, можешь коммитить». Пользователь коммитит. Полный отчёт пишется один в конце (`sprint-report-2.md`).

**Кто что делает:**
- **Code:** пишет код, в конце каждого Pass'а — останавливается и пишет в чат короткое summary («что сделано в Pass N, готов к коммиту»). НЕ делает `git commit` сам.
- **Пользователь:** делает оба `git commit` (по одному в конце каждого Pass'а), запускает sanity-check между пассами, даёт Code сигнал продолжать.

## Контекст

Sprint 1 закрыт — Vite + ES-модули работают. CATALOG, Graph, Drawer рендерятся. 47 захардкоженных метрик в `data.js`.

Текущее состояние UI имеет следующие проблемы (зафиксировано пользователем):

1. **Tweaks-panel** (`tweaks-panel.jsx` + `tweaks-ui.jsx`) — рудимент Claude Design (интерактивные «твиксы» для дизайн-итераций). В прод не нужен. `tw`-props (density / fontFamily / etc.) пробрасываются через app.jsx props chain в большинство компонентов — выпил требует прокатки по chain.
2. **Дубликаты функций** в `graph-view.jsx` vs `app.jsx`: `cx`, `gSparkPath`, `gFakeValue`, `gFakeDelta`, `gSev` — артефакт глобального скоупа script-tag режима.
3. **47 метрик** в `data.js` (захардкоженный массив) vs **236 нормализованных** в `default-vault/_seed/igaming_metrics.json`. Используем JSON, удаляем `data.js` или адаптируем.
4. **Графа Graph и Catalog** имеют разные фильтры (drawer выглядит по-разному), разные карточки-preview, нет общего control-bar. Подписи нод графа есть только у L1, тултип нечитаемый, zoom-меню болтается внизу. Семантика L1/L2/L3 переврана.

См. также:
- `docs/project/CONTEXT.md` секция «Sprint 1» — что уже сделано
- `docs/project/JTBD-full-scope.md` секция 9 (UX-долги M1, Sprint 2) и 9b (Tech debt M1-cleanup)
- `docs/project/sprint-report-1.md` Notes — детали tech debt от тебя самого

---

## Pass 1: Cleanup + Real Data

**Один коммит в конце Pass 1.** Сообщение коммита (предложение):
`Sprint 2 Pass 1: cleanup tweaks-panel + load 236 metrics from seed JSON`

### G1. Выпил tweaks-panel целиком

- Удалить файлы (через `git rm`):
  - `src/tweaks-panel.jsx` (419 строк)
  - `src/tweaks-ui.jsx` (24 строки)
- В `src/app.jsx`:
  - Убрать `import { TweaksUI } from './tweaks-ui.jsx'`
  - Убрать `<TweaksUI tw={tw} setTweak={setTweak} />` (строка ~1573)
  - Убрать `useTweaks(TWEAKS_DEFAULTS)` инициализацию + всё использование `tw`/`setTweak`
  - Убрать `TWEAKS_DEFAULTS` константу
  - Все props-цепочки которые передают `tw` / параметры твиков (density / fontFamily / theme-mode и т.п.) — упростить: подставить **дефолтные значения как константы** в местах потребления, либо оставить hardcoded стиль из текущих defaults в `TWEAKS_DEFAULTS`. **Цель:** ничего не должно поломаться визуально (UI остаётся идентичен текущему дефолту), но сами `tw`-props больше не существуют.
  - Тема DARK/LIGHT — это **не** часть tweaks (это `themeMode` в topbar), её **не трогать**.

### G2. Дубликаты функций → `src/lib/util.js`

- Создать `src/lib/util.js`
- Перенести туда из `app.jsx` и `graph-view.jsx`:
  - `cx` (одна реализация — они идентичны)
  - `gSparkPath` / `sparkPath` (если разные имена, выбрать одно — пометь в репорте)
  - `gFakeValue` / `fakeValue` 
  - `gFakeDelta` / `fakeDelta`
  - `gSev` / `sev` (если есть)
- В `app.jsx` и `graph-view.jsx`: `import { cx, sparkPath, fakeValue, fakeDelta, sev } from './lib/util.js'`
- Префикс `g*` (от «graph») убрать — он был защитой от глобального scope, в ES-модулях не нужен.
- Если функции **отличаются** между файлами (не просто дубликаты, а разные реализации) — занеси в репорт как Notes, выбери одну, обоснуй выбор.

### H. Загрузка 236 метрик из seed JSON

- Прочитать структуру: `default-vault/_seed/igaming_metrics.json` (236 объектов нормализованных метрик)
- В `src/main.jsx` или `src/data.js` (на твоё усмотрение): `import metricsRaw from '../default-vault/_seed/igaming_metrics.json'`
- **Адаптер.** Сравни поля в JSON со схемой текущего `data.js` объекта (поля типа `name/cat/level/prio/freq/owner/source/imp/formula/num/den/b1/b2/b3/red/yellow/traps/fix/deps/tags/ntags`). Если расхождение — напиши **минимальную** функцию-адаптер `adaptMetric(rawJsonMetric) → metricInAppShape`. Помести в `src/data.js` или `src/lib/adapt.js` (на твоё усмотрение).
- Заменить экспорт: `export const METRICS_SEED = metricsRaw.map(adaptMetric)` (или просто прямой mapping если форматы совпадают).
- Старый захардкоженный массив из `data.js` удалить.
- Поля, которых **нет в JSON но есть в data.js** (например, fake значения для current/wow/mom — они генерируются через `fakeValue`/`fakeDelta`): оставить генерируемыми, не пытаться их добавить в JSON.
- В репорте укажи:
  - Какие поля есть в JSON но не используются в UI (Tech Debt — потеря данных)
  - Какие поля UI ожидает но в JSON отсутствуют (Tech Debt — придётся либо deprecate либо синтезировать)

### Pass 1 sanity checks (Code сам перед остановкой)

- `npm install` (если что-то поменялось в зависимостях — не должно)
- `npm run dev` запускается, страница рендерится
- `npm run build` собирается
- В DevTools console — нет красных Error (можно через `npm run dev` + посмотреть в выводе vite)

**Code НЕ делает commit.** В конце Pass 1 пишет в чат пользователю:

```
Pass 1 готов. Изменения:
- Удалены tweaks-panel.jsx, tweaks-ui.jsx (полный выпил рудимента)
- tw-props chain очищена в app.jsx (упомянуть конкретные компоненты которых это коснулось)
- Создан src/lib/util.js, перенесены: cx, sparkPath, fakeValue, fakeDelta, sev
- data.js теперь читает из default-vault/_seed/igaming_metrics.json (236 метрик)
- Адаптер: <если есть — где и какой>

Пожалуйста закоммить (git add -A && git commit -m 'Sprint 2 Pass 1: ...') и проверь:
1. В каталоге 236 карточек вместо 47
2. Tweaks panel отсутствует
3. DevTools console — нет красных Error

Когда подтвердишь, продолжу Pass 2.
```

Ждать сигнала пользователя «продолжай» (или «стоп, проблема X»).

---

## Pass 2: UX Consistency

**Один коммит в конце Pass 2.** Сообщение (предложение):
`Sprint 2 Pass 2: unified ControlBar + Filters + MetricPreview, Graph polish`

### A. Общий ControlBar для Catalog и Graph

- Создать `src/components/ControlBar.jsx` (или `src/control-bar.jsx` если плоская структура — на твоё усмотрение)
- Содержимое (универсальное для обоих view):
  - Кнопка **Filters** (открывает FiltersDrawer — см. B)
  - **Счётчик «X из Y метрик»** — где X = после фильтрации, Y = всего (236 после H)
  - **Alerts-счётчик «X red · Y yellow · Z ok»** — как сейчас на Home view, перенесённый сюда. Цвета: red = красный точка, yellow = жёлтая, ok = зелёная.
  - View-specific controls:
    - На **Catalog**: Size selector (S/M/L) + Layout toggle (Grid / List) — то что сейчас в правом верху Catalog
    - На **Graph**: Zoom controls (`+` / `−` / fit-to-screen) — **переехавшие сюда сверху**, удалить из нижней части экрана
- На **обоих** view ControlBar занимает ту же позицию: тонкая полоска под верхним меню, во всю ширину
- Стиль (фон, padding, border) — как у текущей Catalog control-bar (она ок)

### B. Унифицированные фильтры

- Один компонент `FiltersDrawer` (или как уже в коде — может уже есть, унифицировать). Удалить дубликат версий — оставить одну.
- Порядок секций в drawer: **Alerts → Level → Priority → Owner → Freq → Category**
- Alerts (Red/Yel/OK) — секция была только в Graph-фильтре, перенести в общий
- Версия из Catalog (3-screen) — за основу как более полная (там уже Level/Priority/Owner/Category есть, плюс Freq если был)
- Drawer открывается одинаково на Catalog и Graph (через ControlBar Filters button)

### C. Общий MetricPreview

- Создать `src/components/MetricPreview.jsx` (или `src/metric-preview.jsx`)
- Используется в:
  - **Catalog** — drawer карточки (правая выезжающая панель при клике на карточку)
  - **Graph** — pinned card (правая боковая панель при клике на ноду)
- Внешний вид и контент **идентичны** в обоих случаях
- За основу — текущий drawer карточки в Catalog (более полный)
- Pinned card в Graph переписать на этот компонент

### D. Graph — правильная семантика L1/L2/L3 + collapsible секции

#### D1. Семантика и подписи

Сейчас Claude Design обозначил уровни неправильно. Правильно:

- **L1: Стратегические** — C-level метрики, daily review. Падение = проблема бизнеса.
- **L2: Операционные** — для Product / CRM / Marketing команд. Помогают найти причину изменений в L1.
- **L3: Диагностические** — для deep-dive когда L2 показал аномалию.

Подписи секций на Graph (текстовые лейблы вверху колонок) поправить на эти определения. Сделать **более контрастные** (сейчас выглядят бледно — поднять цвет до читаемого). Использовать существующие переменные палитры.

#### D2. Collapsible секции

- На Graph: клик на подпись секции (например, `L2: Операционные`) сворачивает/разворачивает все ноды этого уровня
- На Catalog: добавить **визуальные перебивки** L1/L2/L3 как разделители блоков карточек, тоже collapsible по клику
- Состояние свёрнут/развёрнут **сохранять в localStorage** (по решению пользователя). Ключ типа `odin.graph.section.l1.collapsed` / `odin.catalog.section.l2.collapsed`
- Иконка-индикатор у заголовка (▼ развёрнуто / ▶ свёрнуто или похожая стандартная)

### E. Graph — ноды и тултип

#### E1. Постоянные подписи нод

- Сейчас: подписи видны только у L1 нод; у L2/L3 появляются на hover
- Сделать: **подписи постоянно видны у всех нод** независимо от уровня
- Размер шрифта подписей можно сделать чуть мельче для L2/L3 если визуально перегружает (на твоё усмотрение, обоснуй в репорте)

#### E2. Контентный тултип

- Сейчас тултип на hover ноды показывает что-то нечитаемое (тёмный текст на тёмном фоне)
- Должен показывать **состояние метрики**:
  - Status badge: Red / Yel / OK (с соответствующим цветом)
  - Текущее значение метрики (например, `$30.40` или `67.80%`)
  - Опционально: WoW дельта (▼ -8.7% / ▲ +2.5%)
- Селектор тултипа в коде ищи через grep `tooltip` или похожее в `graph-view.jsx`

### F. Z-index фикс hover-preview

- Сейчас hover-preview карточки на Graph (микро-превью при наведении на ноду) **залезает под кнопку Filters** в левом верхнем углу (теперь — под общий ControlBar после A)
- Поднять z-index hover-preview выше z-index ControlBar, либо позиционировать так чтобы не пересекалось

### Pass 2 sanity checks

- `npm run dev` запускается
- На Catalog — ControlBar с Filters + counter + alerts-counter + size/layout
- На Graph — такой же ControlBar с Filters + counter + alerts-counter + zoom
- Filters drawer одинаковый на обоих view, порядок секций правильный
- Drawer карточки на Catalog и pinned card на Graph выглядят **идентично**
- Подписи L1/L2/L3 на Graph правильные («Стратегические» etc.)
- Клик на подпись L1 на Graph — все L1 ноды сворачиваются (то же на Catalog)
- После reload страницы свёрнутые секции **остаются свёрнутыми** (localStorage)
- Все ноды графа имеют видимые подписи (не только L1)
- Тултип на ноде показывает читаемое состояние с цветом
- Hover-preview не залезает под ControlBar
- DevTools console — нет красных Error
- `npm run build` собирается, `npm run preview` — визуально идентично dev

**Code НЕ делает commit.** В конце Pass 2 пишет в чат:

```
Pass 2 готов. Изменения:
- A: общий ControlBar в src/components/ControlBar.jsx, используется в Catalog и Graph
- B: унифицированный FiltersDrawer (порядок: Alerts → Level → Priority → Owner → Freq → Category)
- C: общий MetricPreview в src/components/MetricPreview.jsx
- D: семантика L1/L2/L3 поправлена + collapsible секции (persist в localStorage, ключи: ...)
- E: постоянные подписи нод + контентный тултип (Status badge + value + WoW)
- F: z-index hover-preview поправлен (было ..., стало ...)

Сейчас напишу sprint-report-2.md. После него — стоп, жду code review от Cowork.

Когда закоммитишь (git add -A && git commit -m 'Sprint 2 Pass 2: ...'), отчёт уже будет готов и попадёт во второй коммит вместе с pass 2 кодом — так чище.
```

---

## ADR Constraints

- **ADR-007 (Мунин = MD + git)**: загрузка 236 метрик из JSON (Pass 1, H) — это **временный шаг**, не конкурирующая архитектура. JSON остаётся seed-форматом для bootstrap. Финальная реализация (один MD-файл на метрику) — Sprint 3+. **Не выпиливай default-vault/_seed/ — он остаётся источником, мы только начинаем его читать.**
- **ADR-008 (local-first)**: без cloud-зависимостей. Vite + npm пакеты — ОК.
- **CLAUDE.md, Правило 3 (Surgical Changes)**: каждое изменение трассируется к scope. Не «улучшать» соседний код. CSS не переписывать сверх необходимого (новые стили для ControlBar/collapsible — норма; существующие не трогать).
- **CLAUDE.md, ODIN-specific «Прототип Catalog»**: код прототипа править свободно, но без архитектурных переворотов вне scope.

---

## DO NOT

- ❌ **Не TypeScript** — JSX остаётся JSX
- ❌ **Не Tailwind, не shadcn/ui, не lucide-react** — пользоваться существующим CSS и markup-стилем
- ❌ **Не подключать новые либы** без явной необходимости. Если нужна — обоснуй в Notes до использования.
- ❌ **Не настраивать тесты / ESLint / Prettier** — отдельный спринт
- ❌ **Не Electron** — браузерный билд
- ❌ **Не ADR-014 (двух-этапный MVP)** — это отдельный architecture sprint, в этом не делаем
- ❌ **Не трогать `default-vault/_seed/igaming_metrics.json`** — только читаем, не редактируем содержимое и не меняем формат
- ❌ **Не делать MD-файлы метрик** (это Sprint 3 — vertical slice через ADR-007)
- ❌ **Не реализовывать LLM/Хугин/MCP** — это M7-M8
- ❌ **Не реализовывать sync с git remote** — это M-SYNC
- ❌ **Не менять тему DARK/LIGHT механизм** — он работает, не трогать
- ❌ **Не заменять Saved/localStorage на file persistence** — отложено отдельно
- ❌ **Не делать commit'ы вообще** — все коммиты делает пользователь после твоего сигнала «готов». Если в working tree что-то странное (ненужные untracked, console.log, временные файлы) — упомяни в сигнале, чтобы пользователь мог поправить до коммита.
- ❌ **Не идти в Pass 2 не дождавшись «продолжай» от пользователя** — между Pass'ами явная пауза для sanity check.
- ❌ **Не решать scaling-проблемы Graph на 236 нодах** (force-directed layout, virtualization, clustering, авто-группировка под колонками) — после Pass 1 на 236 нодах граф визуально перегружен, подписи перекрываются. Это **известная проблема Sprint 3**, не делать в этом спринте. Твой scope в D — только правильные подписи L1/L2/L3 + collapsible секции. Если collapsible частично разгружает граф (можно свернуть L2/L3) — это побочный полезный эффект, не специально.
- ❌ **Не решать видимость scrollbar / pagination в Catalog** — после загрузки 236 метрик прокрутка стала визуально неуправляемой (нет индикатора прогресса). Это **тоже Sprint 3**, не сейчас. Твой Catalog-scope в Pass 2 — только ControlBar + перебивки L1/L2/L3 collapsible.
- ❌ **При наблюдении других новых scaling/UX-проблем** на 236 метриках — зафлагай в `Notes / Tech Debt` секции отчёта, не пытайся починить в этом спринте.

---

## Sprint Report

После завершения создать `docs/project/sprint-report-2.md` по шаблону из `docs/project/Dev-Cycle.md` (фаза DEV).

Минимально:

- **Status:** Complete / Partial / Blocked
- **Pass 1: What was built** — детально по G1, G2, H
- **Pass 2: What was built** — детально по A, B, C, D, E, F
- **Files Created** (table)
- **Files Modified** (table)
- **Files Deleted** (table) — `tweaks-panel.jsx`, `tweaks-ui.jsx`, плюс что ещё
- **Notes / Tech Debt:**
  - Поля в JSON, не используемые в UI
  - Поля UI, отсутствующие в JSON
  - Если функции `cx`/`sparkPath`/etc различались — какие версии выбрал и почему
  - Любые UI-баги, найденные в процессе и **не починенные** (с явным flag для следующих спринтов)
  - Производительность Graph при 236 нодах (если медленно — flag)
- **How to test (для пользователя):** короткая версия (мы уже знаем как запускать). Только **что новое** проверить:
  - 236 метрик в каталоге
  - Tweaks panel отсутствует
  - ControlBar consistency между Catalog и Graph
  - Filters унифицированы
  - Drawer / pinned card одинаковы
  - L1/L2/L3 правильные определения, collapsible работает + persist в localStorage
  - Тултип на ноде читаемый
  - Hover-preview не перекрывается ControlBar

После репорта — стоп. Cowork сделает code review, потом пользователь — QA.
