# Sprint 2 Fix Report #2

**Date:** 2026-04-27
**Status:** Fixed (3 / 3). Build green (`vite build` ok, 39 modules, 765ms).

Все 3 пункта из `sprint-2-fix-2-prompt.md` сделаны в одном цикле. Один коммит на пользователе.

---

## FIX-A: Подсветка путей через pinned-ноду — постоянная

**Решение:** одинаковый акцентный цвет для hover и pinned (оба — «в фокусе»). Решил не различать визуально, потому что:
- Pinned-нода уже имеет видимый ring (`circle r+3 stroke=accent`) — отличается от hover'нутой и так.
- Два уровня highlight (warm pinned + cold hover) запутывают: пользователю нужен ответ «на чём сейчас фокус», а не «насколько сильно». Union по цвету = ясный сигнал.

**Сделано в `src/graph-view.jsx`:**
- Зеркальный `pinnedConnected` useMemo рядом с `hoveredConnected` — Set из самих pinned + всех нод на расстоянии одной грани.
- Константа `anyFocus = hover != null || pinned.size > 0` — управляет dim'ом edges и нод.
- Edges: `isFocused = touchesHover || touchesPinned` → accent + opacity 0.9 vs 0.1 при `anyFocus`, иначе нейтральный 0.35.
- Nodes: `isFocused = isHov || isPinned || hoveredConnected.has(n) || pinnedConnected.has(n)`; `dim = anyFocus && !isFocused`.
- Если pinned ≥ 2 — подсвечиваются edges и связанные ноды от **каждой** pinned (естественный union).
- Unpin → нода исчезает из `pinned` Set'а → `pinnedConnected` пересчитывается → подсветка снимается без дополнительной логики.

**Файлы:** `src/graph-view.jsx`.

---

## FIX-B: Tooltip рядом с ховернутой нодой

**Решение:** позиция считается в render-функции через SVG `getScreenCTM()` + `DOMPoint.matrixTransform` от `(node.x, node.y)`, минус `canvasRef.getBoundingClientRect()` для canvas-relative координат. Inline `style={{ left, top }}` оверрайдит CSS `top:16; left:16` (теперь это fallback при отсутствии refs).

**Сделано:**
- В `src/graph-view.jsx`: добавлены `canvasRef` (на `<div class="odin__canvas">`) и `transformGroupRef` (на `<g transform=...>`).
- В IIFE рендера tooltip: проектирую SVG-координаты ноды в screen → canvas-relative pixel-координаты. Базовый offset `OFF=18` справа-снизу от ноды.
- **Auto-flip:** при overflow за правый край (`left + 260 > canvasW - 8`) tooltip уходит влево от ноды; при overflow за нижний (`top + 110 > canvasH - 8`) — выше ноды. Минимум 8px от верхнего/левого края.
- При zoom/pan координаты через CTM пересчитываются автоматически (CTM включает SVG viewBox + transform-группу + любой родительский CSS transform). Tooltip всегда у ноды, фиксированного размера (zoom его не масштабирует — он HTML overlay).
- При hover на другую ноду — `hover` state меняется → re-render → новая позиция.

**Trade-off:** tooltip-box измерения захардкожены (`260×110`) как разумная апроксимация существующего layout. Если ширина текста заметно вырастет (длиннющие имена метрик типа `D7_Retention_FTD_Cohort_Bonus_Hunters_Premium`) — auto-flip может сработать чуть-чуть невпопад. Не критично; считать `getBoundingClientRect()` самого tooltip пришлось бы через `useLayoutEffect` после render — overhead не оправдан для cosmetic edge case.

**НЕ сделал:** smooth transition при перелёте между нодами (запрещено по DO NOT — «не улучшать tooltip за пределы FIX-B»).

**Файлы:** `src/graph-view.jsx`.

---

## FIX-C: `pinc__open` кнопка всегда видна + restyle под ControlBar

**Решение:** убрал `opacity: 0` дефолт + `:hover` opacity. Кнопка теперь — bordered-minimal, тот же язык что у `.fbtn` / `.cbar__zoom button` / `.cbar__sizeb`: `transparent` background, `1px solid var(--line-2)` border, `var(--fg-3)` цвет текста, padding `3px 8px`, radius 2. На hover — поднимается до `var(--fg)` + `var(--bg-3)` background + `var(--line)` border. Дополнительно при hover самой карточки текст светлеет до `var(--fg)` (мягкий «карточка живая» сигнал, без border/bg-вспышки).

Текст оставил `OPEN →` — он короткий, в стилистике ControlBar нормально читается.

**Сделано:**
- `src/styles.css` строки 541–556 (бывшие 541–549): переписан `.pinc__open` блок, удалена `opacity:0` + связанный `.pinc:hover .pinc__open { opacity: 1 }`.
- Tooltip `title="Open spec (double-click anywhere)"` на `<button>` оставлен (полезный hint, low cost).
- Double-click на карточку как был — независимый альтернативный путь.

**Файлы:** `src/styles.css`.

---

## Regression check

- **FIX-1..8 (предыдущий cycle):** multi-pin click/double-click/×/clear all — работают (поведение `togglePin`/`unpinAll` не тронуто). Cascading counts — не тронуто. L1/L2/L3 default-collapse + chevron-toggle — не тронуто.
- **Pass 2 (unified ControlBar, Filters drawer, MetricPreview):** Catalog не трогал, Filters не трогал, ControlBar не трогал.
- **Build:** `vite build` чистый, 39 modules, 765ms. Один warning про chunk size — давно есть, не от этого fix-cycle.
- **Линки между фиксами:** `transformGroupRef` нужен и для FIX-B (tooltip projection), и потенциально для FIX-A — но FIX-A не использует ref'ы, чисто на state. Никакой crossover-зависимости.

---

## Diff summary

```
src/graph-view.jsx     +33 / -8   (canvasRef, transformGroupRef, pinnedConnected,
                                    anyFocus, edge/node focus logic, tooltip pos)
src/styles.css         +13 / -7   (.pinc__open restyle)
```

**Готово к ре-тесту 3 пунктов и финалу Sprint 2.**
