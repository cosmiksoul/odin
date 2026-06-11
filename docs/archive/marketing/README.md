# ODIN Pitch Deck

Очень краткий питч для маркетинг-партнёра — story-driven walkthrough функциональности ODIN.

## Файл

- **`odin-pitch.html`** — single-file HTML дек, 10 слайдов. Открывается в любом браузере. Навигация: `←` / `→` / `Space` / `Home` / `End`.

## Как разложить скриншоты

Дек ссылается на 5 скринов в подпапке `screens/`. Создай папку и сохрани туда скрины с такими именами:

| Файл | Что должно быть на скрине |
|---|---|
| `screens/01-home.png` | **Home / Watchlist** — экран «What needs attention now» с правой панелью Catalog Health (236 metrics, 100% spec completeness) |
| `screens/02-catalog-filtered.png` | **Catalog** с открытой панелью фильтров слева, активный фильтр `Alerts: Yellow` + `Level: L1` (16 / 236 метрик) |
| `screens/03-drawer.png` | **Drawer Chargeback Loss** — карточка метрики справа со всеми секциями (Cut by, Current=447, исторический график, Что это и зачем, Как считается, Бенчмарки) |
| `screens/04-graph.png` | **Graph view** с pinned-панелью справа — 5 запиненных метрик (Chargeback Rate, Chargeback Loss, Bonus Activation Rate, Bet per Round, Engagement Quality Score), подсветка путей на графе |
| `screens/05-saved.png` | **Saved metrics digest** — конструктор отчёта (3 pinned, секции с галочками, кнопки Copy Markdown / Report MD / Historical CSV / Spec JSON / Print PDF) |

PNG или JPG — оба сработают. Если файла нет — на слайде покажется placeholder с подсказкой.

## Как открыть

Двойной клик по `odin-pitch.html` — откроется в браузере по умолчанию. Дек full-screen на тёмном фоне в стилистике самого продукта.

## Целевая аудитория

Друг-партнёр (маркетинг/sales background, не data). Цель — чтобы он понял идею продукта и смог пересказать iGaming-стейкхолдерам. Тон лёгкий, без deep-tech, через сторителлинг user journey.

## Структура (10 слайдов)

1. **Cover** — ODIN, privacy-first BI
2. **Идея** — Один + Хугин + Мунин
3. **Боли** — три проблемы аналитика iGaming
4-8. **Story Day 1** — утро → фильтр → детали → граф → отчёт
9. **Будущее** — Conversational Analytics с Хугином
10. **Closing** — позиционирование vs Tableau/Hex
