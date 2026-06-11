# CPR (Cost per Registration)

**Owner:** Marketing · **Источник данных:** BI

## Что это и зачем

Стоимость регистрации. Промежуточная UA-метрика, полезна для оценки top-funnel эффективности

## Формула — детали

Числитель: Ad spend

Знаменатель: Registrations

## Ловушки

1) CPR без Reg2FTD конверсии бессмысленна: CPR ~$1 с Reg2FTD 5% = CPD ~$20. CPR ~$3 с Reg2FTD 25% = CPD ~$12
2) Incentivized registrations (give ~$5 for signup) раздувают объём при нулевом FTD
3) Affiliate fraud: боты генерируют фэйковые реги. Проверять behavioral signals (session time, scroll depth)

## Как улучшать

1) Оптимизация регистрационной формы: минимум полей, авторизацию через соцсети, с приоритетом телефона
2) A/B тест лендинг: длинная vs короткая, с бонусом vs без
3) Снижение drop-off на email/phone верифе: SMS OTP быстрее email
4) Pre-fill данных из UTM/глубокая ссылка

## Алерты (исходный текст)

Red: CPR > CPD × 0.5

Yellow: CPR > CPD × 0.3
