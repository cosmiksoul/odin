# Fraud Rate (Traffic)

**Owner:** Marketing · **Источник данных:** BI

## Что это и зачем

Доля фродового трафика в UA. Прямые потери бюджета на фэйк регах и мотивированном трафике

## Формула — детали

Числитель: Flagged registrations

Знаменатель: Total registrations

## Ловушки

1) Fraud rate 0% подозрителен: скорее всего, не детектируется. Minimum expected: 3-5% в affiliate
2) Мотивированный трафик (incentivized) технически не фрод, но даёт нулевой LTV
3) Обнаружение фрода с задержкой >7 дней означает что вы уже заплатили affiliate. Real-time фильтры критичны

## Как улучшать

1) Антифрод-фильтры в трекере (Keitaro, Binom): device fingerprint, IP reputation, click-to-install time
2) Поведенческие сигналы: session duration <5 sec, no scroll, instant bounce = bot
3) Регулярный аудит affiliate sub-IDs: кластеры одинакового поведения = fraud
4) Post-attribution анализ фрода: регистрации без FTD через 48h = подозрительно
