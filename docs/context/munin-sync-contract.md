---
created: '2026-04-24'
part-of: Odin/README
tags:
  - odin
  - munin
  - contract
  - integration
  - data-engineering
---
# 07 · Munin Sync Contract

> Спецификация формата Parquet-витрины, которую data-team компании готовит для синка с ODIN. Зафиксировано в decisions-log.md ADR-010.

## Зачем эта заметка

Чтобы интеграция ODIN с реальным ДВХ компании работала, data-инженер должен **точно** знать, какой формат витрины ожидает ODIN. Без жёсткой спецификации:
- Каждый интегратор будет догадываться → разный формат → не работает
- Техподдержка съест время автора отвечая на одни и те же вопросы

Эта заметка — **единственный источник истины** про формат. Любые изменения проходят через ADR.

## Высокоуровневая схема

```
master_view.parquet (long format)

metric_id  | date       | dim_key  | dim_value  | value   | value_type
-----------|------------|----------|------------|---------|------------
ggr_margin | 2026-04-22 | overall  | overall    | 3.24    | percent
ggr_margin | 2026-04-22 | geo      | br         | 2.81    | percent
ggr_margin | 2026-04-22 | geo      | mx         | 3.42    | percent
ggr_margin | 2026-04-22 | product  | casino     | 3.12    | percent
ggr_margin | 2026-04-22 | product  | sports     | 6.51    | percent
ftd_count  | 2026-04-22 | overall  | overall    | 1775    | count
ftd_count  | 2026-04-22 | geo      | br         | 420     | count
uptime     | 2026-04-22 | overall  | overall    | 99.92   | percent
```

Long format. Одна строка = одно значение метрики на одну дату по одному разрезу.

## Описание колонок

### `metric_id` — обязательно, VARCHAR

Slug метрики, должен совпадать с одним из 236 `metric_id`, которые знает ODIN. Список — в репозитории ODIN, файл `metrics-registry.json` (генерируется из MD-файлов спек).

Примеры: `ggr_margin`, `ftd_count`, `uptime`, `retention_d7`.

**Что если у компании метрика называется по-своему?** Они сами делают mapping в своей dbt-модели:
```sql
SELECT
  'ggr_margin' AS metric_id,
  ...
FROM their_internal_view_with_different_name
```

### `date` — обязательно, DATE

Дата, к которой относится значение. Гранулярность — день. Часовая зона — UTC по умолчанию (можно переопределить в config ODIN).

**Если у компании метрика месячная** — кладём её на первое число месяца. ODIN при отображении понимает по `frequency` из spec.md, что это месячная метрика.

### `dim_key` — обязательно, VARCHAR

Имя разреза. Зарезервированное значение `overall` означает "общее значение, без разреза".

Допустимые `dim_key` для каждой метрики — указаны в её spec.md в поле `dimensions`. Если в витрине придёт неизвестный для метрики `dim_key` — ODIN его проигнорирует (не сломается).

Канонические значения: `geo`, `product`, `channel`, `segment`, `tier`, `device`, `provider`, `payment_method`, `bonus_type`, `game`. Полный список — в `dimensions-registry.json` репозитория ODIN.

### `dim_value` — обязательно, VARCHAR

Значение разреза. Если `dim_key = overall`, то `dim_value = overall`.

**Канонические значения dim_value:**
- Для `geo`: ISO-2 коды стран в нижнем регистре — `br`, `mx`, `kz`, `ru`, `ua`, `in`, `ph`, `id`, `de`, `gb`. Регионы: `eu`, `latam`, `cis`, `sea`.
- Для `product`: `casino`, `sports`, `live_casino`, `poker`, `virtual_sports`.
- Для `segment`: `new`, `active`, `vip`, `churned`, `reactivated`.
- Для `channel`: `organic`, `seo`, `paid_search`, `paid_social`, `affiliate`, `crm`, `direct`.

Полный словарь — в `dimensions-vocabulary.json` репозитория ODIN.

**Что если у компании уникальное значение разреза, не в словаре?** Допустимо — ODIN покажет как есть. Но они теряют возможность сравнения с бенчмарками "по региону" в спеке.

### `value` — обязательно, DOUBLE

Численное значение. Семантика зависит от `value_type`.

**Разрешённые специальные значения:**
- `NULL` — данные отсутствуют (например, метрика не считалась в эту дату). ODIN не показывает точку на графике.
- `0` — значение действительно ноль. ODIN показывает.

### `value_type` — опционально, VARCHAR (default: `numeric`)

Тип значения для корректного форматирования в UI:
- `percent` — отображаем как `3.24%`
- `count` — отображаем как целое: `1775`
- `currency` — отображаем как `$30.40` (валюта по умолчанию USD, можно переопределить в spec)
- `duration_seconds` — отображаем как `5.2s` или `2m 15s`
- `numeric` — отображаем как есть с двумя знаками после запятой: `3.24`

Если поле не заполнено в витрине — ODIN берёт значение из spec.md метрики.

## Что НЕ входит в контракт (важно)

- **Никаких persona-level данных.** Витрина агрегирует, не выгружает row-per-user. Это даёт data-team полный контроль над privacy.
- **Никаких прямых SQL-запросов от ODIN к ДВХ.** ODIN читает только готовый файл.
- **Никаких credentials к продакшену.** ODIN не имеет доступа к боевым системам компании.
- **Никаких реальных событий или транзакций.** Витрина — это **пред-агрегированные метрики**, не raw events.

## Sync mechanisms (как ODIN получает витрину)

### MVP (минимум)

**1. Manual import через UI**
Пользователь открывает ODIN → "Settings → Data → Import Parquet" → выбирает файл с диска → ODIN валидирует и загружает в локальный DuckDB.

**2. Watch local folder**
Пользователь указывает путь к папке (например, `~/odin-data/`). ODIN периодически проверяет `mtime` файла `master_view.parquet`, при изменении — автоматически перечитывает.

### Future (v0.5+)

**3. HTTP endpoint**
Компания хостит файл по URL (внутренний nginx, S3 presigned URL). ODIN периодически делает HEAD-запрос, при изменении `Last-Modified` / `ETag` — скачивает.

**4. S3-compatible**
ODIN поддерживает AWS S3 / MinIO / Backblaze / любой S3-compatible storage через стандартный SDK. Пользователь указывает bucket + credentials.

**5. SFTP / SCP**
Для совсем параноидальных компаний.

## Валидация при первом sync

ODIN при первом импорте витрины показывает понятное сообщение:

```
✓ Файл валиден
✓ Колонки соответствуют схеме
✓ Найдено 47 metric_id из 236 в реестре ODIN
ℹ Не найдено 189 metric_id (отсутствуют в витрине):
  - ggr (Revenue, Must)
  - retention_d7 (Retention, Must)
  - ... (показать все)

  Это нормально — компания может не отдавать все метрики.
  ODIN покажет только те, что есть в витрине.

⚠ 3 неизвестных metric_id — будут проигнорированы:
  - some_internal_metric_xyz
  - ...
  Если это ваши кастомные метрики — добавьте их spec.md в /metrics/

[Импортировать] [Отмена]
```

## Версионирование контракта

**Принцип:** forward-compatible. Новые поля добавляются как nullable, старые витрины продолжают работать.

Текущая версия: **v1**.

Если когда-то добавится поле (например, `confidence_interval`) — оно будет nullable. Старые витрины без него продолжат работать.

Если потребуется **breaking change** — ODIN при импорте определит несовместимость по metadata Parquet-файла и выдаст инструкцию по миграции.

## Пример dbt-модели для data-team компании

```sql
-- models/exports/odin_master_view.sql

WITH
  ggr_margin AS (
    SELECT
      'ggr_margin' AS metric_id,
      report_date AS date,
      'overall' AS dim_key,
      'overall' AS dim_value,
      ggr_margin_pct AS value,
      'percent' AS value_type
    FROM {{ ref('fct_revenue_daily') }}

    UNION ALL

    SELECT
      'ggr_margin' AS metric_id,
      report_date AS date,
      'geo' AS dim_key,
      country_code AS dim_value,
      ggr_margin_pct AS value,
      'percent' AS value_type
    FROM {{ ref('fct_revenue_daily_by_geo') }}
  ),

  ftd_count AS (
    SELECT
      'ftd_count' AS metric_id,
      report_date AS date,
      'overall' AS dim_key,
      'overall' AS dim_value,
      ftd_count AS value,
      'count' AS value_type
    FROM {{ ref('fct_acquisition_daily') }}
    -- ... + по разрезам
  )

SELECT * FROM ggr_margin
UNION ALL
SELECT * FROM ftd_count
-- ... + остальные метрики, которые data-team готова экспортировать
```

Результат — обычная dbt-модель, экспортируемая в Parquet через какой-нибудь dbt-external-tables плагин или ручной post-hook.

## Что остаётся открытым

- **Точный формат `metrics-registry.json`** — генерируется из MD-спек, но точная схема нужна data-инженерам компании. Откладываем до v0.3.
- **Поддержка часовых зон** — для MVP UTC-only. Расширим если будет запрос.
- **Партиционирование** — в v1 один файл, в v2+ можно поддержать партицию по году/месяцу для больших объёмов.
- **Incremental updates** — пока полная замена файла. Append-only / upsert — отложенно.

## Где в архитектуре всё это живёт

См. architecture.md — слой "Хранилище значений". Контракт описан **здесь**, реализация Parquet-reader-а через DuckDB — там.
