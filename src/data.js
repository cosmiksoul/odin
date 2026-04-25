// Seed metrics — based on data_sample.md, repeated/varied to fill ~48 cards
export const METRICS_SEED = [
  {
    name: "GGR Margin / Hold %", cat: "Revenue", level: "L1", prio: "Must", freq: "Daily",
    owner: "Product", source: "BI",
    imp: "Процент удержания — сколько от каждой ставки остаётся оператору. Определяет юнит-экономику всего бизнеса.",
    formula: "GGR / Total Wager × 100%", num: "GGR", den: "Total Wager",
    b1: "Casino 3–5%, Sports 6–8%", b2: "Casino 3–5%, Sports 5–7%", b3: "Casino 3–5%, Sports 5–7%",
    red: "<2% casino", yellow: "<3% casino",
    traps: [
      "Процент удержания казино (3-5%) и спорта (5-8%) нельзя сравнивать — разные продукты с разной природой",
      "На коротком периоде (менее 1000 раундов) отклонения до ±3 п.п. — нормальная статистическая дисперсия",
      "Попытка поднять hold% за счёт снижения RTP ведёт к оттоку опытных игроков и негативным отзывам"
    ],
    fix: [
      "Смещать набор игр в сторону тех, где hold% выше среднего",
      "В спортсбуке — настраивать маржу (overround), управлять наценкой по типу ставки",
      "Контролировать RTP по провайдерам через дашборд агрегатора",
      "Ограничивать доступ к играм с высоким RTP для бонусных денег"
    ],
    deps: ["GGR", "Total Wager (Casino)"],
    tags: ["ГЕО", "продукт"], ntags: ["geo", "продукт"]
  },
  {
    name: "FTD Count", cat: "Active User Base", level: "L1", prio: "Must", freq: "Daily",
    owner: "Marketing", source: "Payments",
    imp: "Количество первых депозитов. Главный показатель эффективности связки UA + product. Топ-3 KPI для бизнеса.",
    formula: "Count of first deposits", num: "Count of first deposits", den: "—",
    b1: "1–5% of visits, CPA ~$30–80", b2: "1–4% of visits, CPA ~$15–40", b3: "1–3% of visits, CPA ~$5–20",
    red: "Drop >20% WoW", yellow: "Drop >10% WoW",
    traps: [
      "FTD count без LTV когорты = метрика тщеславия. 1000 FTD × ~$5 LTV < 200 FTD × ~$100 LTV",
      "FTD всплески от промо-акций могут дать некачественных игроков — мониторить D7 retention по когорте"
    ],
    fix: [
      "Рост Reg→FTD конверсии (обычно дешевле, чем рост регистраций)",
      "Расширение способов оплаты для uncovered сегментов"
    ],
    deps: [], tags: ["ГЕО", "канал", "платёжка"], ntags: ["geo", "канал", "метод платежа"]
  },
  {
    name: "Uptime", cat: "Tech / Reliability", level: "L1", prio: "Must", freq: "Daily",
    owner: "Tech", source: "Monitoring",
    imp: "Доступность платформы. Каждая минута даунтайма — прямая потеря выручки. Uptime это не техническая метрика, это деньги.",
    formula: "% доступности (platform, cashier, games, feed)", num: "Uptime minutes", den: "Total minutes",
    b1: ">99.9%", b2: ">99.9%", b3: ">99.9%",
    red: "<99.5%", yellow: "<99.7%",
    traps: [
      "Целевой ориентир: минимум 99.9% (8.7 часов даунтайма в год), премиум — 99.95%",
      "Нужна разбивка по компонентам: общий uptime 99.9%, а платёжный шлюз 98% — это проблема",
      "Исключайте плановое обслуживание из расчёта"
    ],
    fix: [
      "Отказоустойчивая инфраструктура: multi-AZ, автоматический failover, никаких единых точек отказа",
      "Load balancing — распределяем нагрузку",
      "Мониторинг в реальном времени — узнаём о проблеме до игроков"
    ],
    deps: [], tags: ["cashier", "Сервис (platform, games)"], ntags: ["метод платежа", "сервис"]
  },
  {
    name: "GGR", cat: "Revenue", level: "L1", prio: "Must", freq: "Daily",
    owner: "Finance", source: "BI",
    imp: "Валовой игорный доход — разница между ставками игроков и выплатами. Топ-строка P&L для iGaming.",
    formula: "Total Wager − Total Winnings", num: "Total Wager − Total Winnings", den: "—",
    b1: "Depends on scale", b2: "Depends on scale", b3: "Depends on scale",
    red: "Drop >15% WoW", yellow: "Drop >8% WoW",
    traps: [
      "GGR без разбивки по продукту (casino/sports) скрывает проблемы одного из направлений",
      "Bonus cost не вычитается из GGR — это делается уже на NGR уровне"
    ],
    fix: ["Смотреть daily по продукту и гео", "Корреляция с активными игроками и средним депозитом"],
    deps: ["Total Wager (Casino)", "Total Winnings"],
    tags: ["ГЕО", "продукт"], ntags: ["geo", "продукт"]
  },
  {
    name: "NGR", cat: "Revenue", level: "L1", prio: "Must", freq: "Daily",
    owner: "Finance", source: "BI",
    imp: "Чистый игорный доход — GGR за вычетом бонусных издержек и налогов. Более честная картина монетизации.",
    formula: "GGR − Bonus Cost − Gaming Tax − Chargebacks", num: "GGR − Costs", den: "—",
    b1: "60–80% of GGR", b2: "65–85% of GGR", b3: "70–90% of GGR",
    red: "NGR/GGR <55%", yellow: "NGR/GGR <65%",
    traps: [
      "Bonus cost легко раздуть промо-кампанией и получить NGR намного ниже плана",
      "Gaming tax варьируется по юрисдикциям — усреднение скрывает проблемные рынки"
    ],
    fix: ["Оптимизация bonus budget vs активность игроков", "Гео-микс в сторону low-tax рынков"],
    deps: ["GGR", "Bonus Cost Ratio"],
    tags: ["ГЕО", "продукт"], ntags: ["geo", "продукт"]
  },
  {
    name: "Total Wager (Casino)", cat: "Casino / Games", level: "L2", prio: "Should", freq: "Daily",
    owner: "Product", source: "BI",
    imp: "Суммарный объём ставок в казино. База для расчёта hold% и активности.",
    formula: "Σ bet_amount по всем спинам за период", num: "Σ bet_amount", den: "—",
    b1: "Depends on scale", b2: "Depends on scale", b3: "Depends on scale",
    red: "Drop >20% WoW", yellow: "Drop >10% WoW",
    traps: ["Rerolls и auto-play искажают среднее"],
    fix: ["Разбивка по провайдерам и типу игр"],
    deps: [], tags: ["провайдер", "игра"], ntags: ["провайдер", "игра"]
  },
  {
    name: "Total Winnings", cat: "Casino / Games", level: "L2", prio: "Should", freq: "Daily",
    owner: "Product", source: "BI",
    imp: "Суммарные выигрыши игроков. Вместе с Total Wager даёт GGR.",
    formula: "Σ payouts", num: "Σ payouts", den: "—",
    b1: "~95% of wager", b2: "~95% of wager", b3: "~95% of wager",
    red: "RTP >98% on regular titles", yellow: "RTP >97%",
    traps: ["Jackpot-выплаты дают spike — смотреть median, не mean"],
    fix: ["Мониторинг RTP по слоту и провайдеру"],
    deps: ["Total Wager (Casino)"], tags: ["провайдер"], ntags: ["провайдер"]
  },
  {
    name: "Bonus Cost Ratio", cat: "Bonuses", level: "L2", prio: "Must", freq: "Weekly",
    owner: "CRM", source: "Bonus Engine",
    imp: "Доля бонусных расходов относительно GGR. Ключевая метрика эффективности промо.",
    formula: "Bonus Cost / GGR × 100%", num: "Bonus Cost", den: "GGR",
    b1: "15–25%", b2: "18–28%", b3: "20–35%",
    red: ">40%", yellow: ">30%",
    traps: [
      "Bonus abuse игроками раздувает cost без роста LTV",
      "Wagering не завершён — реальный cost узнаётся позже"
    ],
    fix: ["Segmented offers", "Game weighting в wagering"],
    deps: ["GGR", "Wagering Completion Rate"], tags: ["Тип бонуса", "сегмент"], ntags: ["тип бонуса", "сегмент"]
  },
  {
    name: "Wagering Completion Rate", cat: "Bonuses", level: "L3", prio: "Should", freq: "Weekly",
    owner: "CRM", source: "Bonus Engine",
    imp: "Доля игроков, которые полностью отыграли бонус. Показывает адекватность wagering-требований.",
    formula: "Completed Wagers / Bonus Redemptions", num: "Completed", den: "Redemptions",
    b1: "30–50%", b2: "25–45%", b3: "20–40%",
    red: "<15%", yellow: "<25%",
    traps: ["Слишком мягкий wagering → убытки; слишком жёсткий → недовольство"],
    fix: ["A/B-тест wagering множителей", "Тематическая сегментация"],
    deps: ["Bonus Cost Ratio"], tags: ["Тип бонуса"], ntags: ["тип бонуса"]
  },
  {
    name: "CAC", cat: "Acquisition (UA)", level: "L1", prio: "Must", freq: "Weekly",
    owner: "Marketing", source: "Analytics",
    imp: "Стоимость привлечения одного FTD. Сопоставляется с LTV для оценки юнит-экономики.",
    formula: "Marketing Spend / FTD Count", num: "Marketing Spend", den: "FTD Count",
    b1: "$30–80", b2: "$15–40", b3: "$5–20",
    red: "CAC > LTV/2", yellow: "CAC > LTV/3",
    traps: ["Organic traffic учтён в спенде — искажает атрибуцию", "Partial-месяц спенда vs когорта FTD"],
    fix: ["MMM-модели", "Сегментировать по каналу и гео"],
    deps: ["FTD Count", "LTV:CAC Ratio"], tags: ["ГЕО", "канал"], ntags: ["geo", "канал"]
  },
  {
    name: "LTV (90d)", cat: "Unit Economics", level: "L1", prio: "Must", freq: "Weekly",
    owner: "Analytics", source: "BI",
    imp: "Средняя выручка на игрока за 90 дней. База для оценки ROI кампаний.",
    formula: "Σ NGR per player / cohort size, 90d window", num: "Cohort NGR", den: "Cohort size",
    b1: "$120–300", b2: "$60–150", b3: "$20–60",
    red: "LTV < 2×CAC", yellow: "LTV < 3×CAC",
    traps: ["Короткая когорта (<30d) не даёт стабильной оценки", "Жирные киты искажают mean — смотреть median"],
    fix: ["LTV-прогнозы через retention curve", "Сегментация по когорте"],
    deps: ["CAC", "Retention D30"], tags: ["ГЕО", "сегмент"], ntags: ["geo", "сегмент"]
  },
  {
    name: "LTV:CAC Ratio", cat: "Unit Economics", level: "L1", prio: "Must", freq: "Weekly",
    owner: "Finance", source: "BI",
    imp: "Ключевое отношение юнит-экономики. <1 — бизнес убыточен; >3 — возможно стоит агрессивнее тратить.",
    formula: "LTV / CAC", num: "LTV", den: "CAC",
    b1: ">3", b2: ">2.5", b3: ">2",
    red: "<1.5", yellow: "<2",
    traps: ["Сравнение LTV (90d) с CAC не-cohort'а искажает"],
    fix: ["Cohort-based LTV", "Payback period <12mo"],
    deps: ["LTV (90d)", "CAC"], tags: ["канал"], ntags: ["канал"]
  },
  {
    name: "Retention D1", cat: "Retention", level: "L2", prio: "Must", freq: "Daily",
    owner: "Product", source: "Analytics",
    imp: "Доля новых игроков, вернувшихся на следующий день. Ранний сигнал качества онбординга.",
    formula: "Returned on D1 / New Players", num: "Returned", den: "New Players",
    b1: "35–55%", b2: "30–50%", b3: "25–45%",
    red: "<25%", yellow: "<32%",
    traps: ["Push-уведомления в D0 искусственно поднимают D1"],
    fix: ["Онбординг с welcome-bonus", "Push-triggers по сегменту"],
    deps: ["FTD Count"], tags: ["сегмент", "канал"], ntags: ["сегмент", "канал"]
  },
  {
    name: "Retention D7", cat: "Retention", level: "L2", prio: "Must", freq: "Daily",
    owner: "Product", source: "Analytics",
    imp: "Доля, вернувшихся через 7 дней. Основной индикатор 'липкости' продукта.",
    formula: "Returned on D7 / New Players", num: "Returned", den: "New Players",
    b1: "18–30%", b2: "15–25%", b3: "12–22%",
    red: "<10%", yellow: "<15%",
    traps: ["Bonus-driven retention не всегда конвертируется в LTV"],
    fix: ["CRM-триггеры по D3-D5", "Product experiments на engagement"],
    deps: ["Retention D1"], tags: ["сегмент"], ntags: ["сегмент"]
  },
  {
    name: "Retention D30", cat: "Retention", level: "L2", prio: "Should", freq: "Weekly",
    owner: "Product", source: "Analytics",
    imp: "Доля, активная через 30 дней. Показатель долгосрочной ценности.",
    formula: "Active on D30 / New Players", num: "Active", den: "New Players",
    b1: "8–15%", b2: "6–12%", b3: "4–10%",
    red: "<4%", yellow: "<7%",
    traps: ["D30 медленный сигнал — корректировка через 1+ месяц"],
    fix: ["Loyalty программы", "Персонализация игр"],
    deps: ["Retention D7", "LTV (90d)"], tags: ["сегмент"], ntags: ["сегмент"]
  },
  {
    name: "MAU", cat: "Active User Base", level: "L1", prio: "Must", freq: "Weekly",
    owner: "Product", source: "BI",
    imp: "Monthly Active Users. Размер активной игровой базы.",
    formula: "Unique players with ≥1 action in 30d", num: "Unique active", den: "—",
    b1: "Depends on scale", b2: "Depends on scale", b3: "Depends on scale",
    red: "Drop >15% MoM", yellow: "Drop >8% MoM",
    traps: ["Bot-аккаунты, multi-accounting", "Session vs deposit activity"],
    fix: ["Чистка bot-трафика через fraud-слой"],
    deps: ["DAU", "Retention D30"], tags: ["ГЕО"], ntags: ["geo"]
  },
  {
    name: "DAU", cat: "Active User Base", level: "L2", prio: "Must", freq: "Daily",
    owner: "Product", source: "BI",
    imp: "Daily Active Users. Pulse продукта — мгновенная реакция на релизы и промо.",
    formula: "Unique players with ≥1 action in 24h", num: "Unique active", den: "—",
    b1: "Depends on scale", b2: "Depends on scale", b3: "Depends on scale",
    red: "Drop >10% DoD", yellow: "Drop >5% DoD",
    traps: ["День недели влияет — сравнивать WoW, не DoD"],
    fix: ["Сегментация по каналам, сегментам, гео"],
    deps: ["MAU"], tags: ["ГЕО"], ntags: ["geo"]
  },
  {
    name: "Average Deposit", cat: "Payments (Deposits)", level: "L2", prio: "Should", freq: "Daily",
    owner: "Payments", source: "Payments",
    imp: "Средний чек депозита. Индикатор качества трафика и сегмента.",
    formula: "Σ Deposits / Deposit Count", num: "Σ Deposits", den: "Count",
    b1: "$50–150", b2: "$20–80", b3: "$10–40",
    red: "Drop >20% WoW", yellow: "Drop >10%",
    traps: ["VIP-депозиты искажают mean — смотреть median"],
    fix: ["Top-up бонусы по сегменту", "Предложение depositов по гео"],
    deps: [], tags: ["метод платежа", "ГЕО"], ntags: ["метод платежа", "geo"]
  },
  {
    name: "Deposit Success Rate", cat: "Payments (Deposits)", level: "L1", prio: "Must", freq: "Daily",
    owner: "Payments", source: "Payments",
    imp: "Доля успешных попыток депозита. Прямая дыра в воронке — каждый % = потерянные деньги.",
    formula: "Successful / Attempted", num: "Successful", den: "Attempted",
    b1: ">92%", b2: ">88%", b3: ">82%",
    red: "<80%", yellow: "<86%",
    traps: ["3DS вводит флюктуации", "Gateway-specific деградация"],
    fix: ["Routing по best-performing PSP", "Retry policies"],
    deps: [], tags: ["метод платежа"], ntags: ["метод платежа"]
  },
  {
    name: "Withdrawal Time (median)", cat: "Payments (Withdrawals)", level: "L1", prio: "Must", freq: "Daily",
    owner: "Payments", source: "Payments",
    imp: "Медиана времени от запроса вывода до зачисления. Напрямую влияет на trust и retention.",
    formula: "median(time_withdraw_requested → time_funded)", num: "median time", den: "—",
    b1: "<6h", b2: "<12h", b3: "<24h",
    red: ">48h", yellow: ">24h",
    traps: ["KYC-задержки — отдельный процесс", "Пиковые часы искажают"],
    fix: ["Auto-withdrawal для verified VIP", "KYC pre-check"],
    deps: [], tags: ["метод платежа"], ntags: ["метод платежа"]
  },
  {
    name: "KYC Completion Rate", cat: "Compliance", level: "L2", prio: "Must", freq: "Weekly",
    owner: "Compliance", source: "Analytics",
    imp: "Доля игроков, прошедших верификацию. Low KYC — блокирует вывод и портит trust.",
    formula: "KYC Approved / KYC Started", num: "Approved", den: "Started",
    b1: ">85%", b2: ">78%", b3: ">70%",
    red: "<60%", yellow: "<72%",
    traps: ["Step-by-step drop-off скрывает bottleneck"],
    fix: ["Upfront KYC vs deferred — A/B", "Document upload UX"],
    deps: [], tags: ["ГЕО", "сегмент"], ntags: ["geo", "сегмент"]
  },
  {
    name: "Chargeback Rate", cat: "Risk / Antifraud", level: "L2", prio: "Must", freq: "Weekly",
    owner: "Risk", source: "Payments",
    imp: "Доля чарджбэков. Выше 1% — риск санкций от платёжных систем.",
    formula: "Chargebacks / Total Deposits", num: "CB Count", den: "Deposit Count",
    b1: "<0.5%", b2: "<0.8%", b3: "<1.2%",
    red: ">1%", yellow: ">0.6%",
    traps: ["Friendly fraud vs true fraud — разные fix"],
    fix: ["3DS обязательно для high-risk BIN", "Velocity rules"],
    deps: [], tags: ["метод платежа", "ГЕО"], ntags: ["метод платежа", "geo"]
  },
  {
    name: "Sportsbook Hold %", cat: "Sportsbook", level: "L1", prio: "Must", freq: "Daily",
    owner: "Product", source: "Betting Engine",
    imp: "Маржа букмекера. Настраивается через overround — балансирует прибыль и ценовую конкурентность.",
    formula: "Sports GGR / Sports Wager × 100%", num: "Sports GGR", den: "Sports Wager",
    b1: "6–8%", b2: "5–7%", b3: "5–7%",
    red: "<4%", yellow: "<5%",
    traps: ["Volatility по типу спорта — футбол vs теннис", "Live vs pre-match"],
    fix: ["Price management team", "Margin по market type"],
    deps: ["GGR"], tags: ["спорт", "тип ставки"], ntags: ["игра", "продукт"]
  },
  {
    name: "Reg→FTD Conversion", cat: "Funnel (Product)", level: "L1", prio: "Must", freq: "Daily",
    owner: "Product", source: "Analytics",
    imp: "Конверсия из регистрации в первый депозит. Ключевая точка воронки привлечения.",
    formula: "FTD Count / Registrations", num: "FTD", den: "Registrations",
    b1: "35–55%", b2: "30–50%", b3: "25–45%",
    red: "<22%", yellow: "<30%",
    traps: ["Time-window важен — 7d vs 30d дают разные цифры"],
    fix: ["Welcome-бонус A/B", "Обязательные поля в регистрации"],
    deps: ["FTD Count"], tags: ["канал", "ГЕО"], ntags: ["канал", "geo"]
  },
  {
    name: "ARPU", cat: "Unit Economics", level: "L2", prio: "Must", freq: "Weekly",
    owner: "Finance", source: "BI",
    imp: "Average Revenue Per User. Индикатор монетизации базы.",
    formula: "NGR / MAU", num: "NGR", den: "MAU",
    b1: "$80–200", b2: "$40–120", b3: "$15–60",
    red: "Drop >15%", yellow: "Drop >8%",
    traps: ["VIP skew — смотреть median ARPU"],
    fix: ["Segmented campaigns", "VIP retention"],
    deps: ["NGR", "MAU"], tags: ["ГЕО", "сегмент"], ntags: ["geo", "сегмент"]
  },
  {
    name: "VIP Share of NGR", cat: "VIP", level: "L1", prio: "Must", freq: "Weekly",
    owner: "VIP", source: "BI",
    imp: "Доля выручки от VIP-сегмента. Концентрационный риск — >40% от <1% игроков.",
    formula: "VIP NGR / Total NGR", num: "VIP NGR", den: "Total NGR",
    b1: "30–50%", b2: "35–55%", b3: "25–45%",
    red: ">65% (concentration risk)", yellow: ">55%",
    traps: ["Определение VIP должно быть стабильно — перенос игрока сдвигает метрики"],
    fix: ["Mid-tier cultivation", "VIP churn preservation"],
    deps: ["NGR"], tags: ["tier", "сегмент"], ntags: ["tier", "сегмент"]
  },
  {
    name: "VIP Churn", cat: "VIP", level: "L2", prio: "Must", freq: "Weekly",
    owner: "VIP", source: "CRM",
    imp: "Отток VIP за период. Каждый ушедший VIP — dozens of regular LTV.",
    formula: "VIP with no activity 30d / VIP base", num: "Inactive VIP", den: "VIP base",
    b1: "<5%", b2: "<7%", b3: "<10%",
    red: ">12%", yellow: ">8%",
    traps: ["VIP-менеджеры скрывают churn ручным re-activation"],
    fix: ["Early-warning VIP-скоринг", "Персональные offers по tier"],
    deps: ["VIP Share of NGR"], tags: ["tier"], ntags: ["tier"]
  },
  {
    name: "CRM Campaign CTR", cat: "CRM", level: "L3", prio: "Should", freq: "Weekly",
    owner: "CRM", source: "CRM",
    imp: "Click-through rate по email/push. Индикатор relevance контента.",
    formula: "Clicks / Delivered", num: "Clicks", den: "Delivered",
    b1: "4–8%", b2: "3–7%", b3: "2–6%",
    red: "<1.5%", yellow: "<3%",
    traps: ["Segment quality важнее CTR", "Opening rate ≠ engagement"],
    fix: ["Persona-based сегменты", "A/B subject lines"],
    deps: [], tags: ["канал", "сегмент"], ntags: ["канал", "сегмент"]
  },
  {
    name: "Affiliate Share of FTD", cat: "Affiliate", level: "L2", prio: "Should", freq: "Weekly",
    owner: "Marketing", source: "Analytics",
    imp: "Доля FTD через партнёрскую сеть. Зависимость vs диверсификация.",
    formula: "Affiliate FTD / Total FTD", num: "Affiliate FTD", den: "Total FTD",
    b1: "20–40%", b2: "30–55%", b3: "40–65%",
    red: ">70% (dependency risk)", yellow: ">60%",
    traps: ["Last-click атрибуция завышает affiliate"],
    fix: ["Диверсификация каналов", "Direct awareness"],
    deps: ["FTD Count"], tags: ["канал"], ntags: ["канал"]
  },
  {
    name: "UX Friction Score", cat: "UX Friction", level: "L3", prio: "Nice", freq: "Monthly",
    owner: "Product", source: "Analytics",
    imp: "Композитный скор болевых точек в продукте. Собран из session replays, form errors, rage clicks.",
    formula: "Weighted sum of friction events / sessions", num: "Friction events", den: "Sessions",
    b1: "<0.3", b2: "<0.4", b3: "<0.5",
    red: ">0.6", yellow: ">0.45",
    traps: ["Subjective weights — калибровать ежеквартально"],
    fix: ["Heatmaps review", "Form optimization"],
    deps: [], tags: ["device", "сегмент"], ntags: ["device", "сегмент"]
  },
  {
    name: "Support Resolution Time", cat: "Support", level: "L3", prio: "Should", freq: "Weekly",
    owner: "Tech", source: "Monitoring",
    imp: "Медиана времени закрытия тикета. Прямо влияет на retention VIP и complaint rate.",
    formula: "median(closed_at − opened_at)", num: "median time", den: "—",
    b1: "<4h", b2: "<8h", b3: "<16h",
    red: ">24h", yellow: ">12h",
    traps: ["Auto-close inflates метрику — фильтровать только resolved"],
    fix: ["FAQ для топ-5 вопросов", "Chatbot triage"],
    deps: [], tags: ["канал"], ntags: ["канал"]
  },
  {
    name: "Game Launch Latency", cat: "Tech / Reliability", level: "L3", prio: "Should", freq: "Daily",
    owner: "Tech", source: "Monitoring",
    imp: "Время от клика 'играть' до загрузки игры. Каждая лишняя секунда — drop-off.",
    formula: "p95(game_loaded − click_ts)", num: "p95 latency", den: "—",
    b1: "<3s", b2: "<5s", b3: "<7s",
    red: ">10s", yellow: ">6s",
    traps: ["CDN-специфичные задержки в гео"],
    fix: ["Pre-loading", "Edge CDN"],
    deps: ["Uptime"], tags: ["провайдер", "device"], ntags: ["провайдер", "device"]
  },
  {
    name: "Responsible Gambling Flags", cat: "Responsible Gambling", level: "L2", prio: "Must", freq: "Weekly",
    owner: "Compliance", source: "Analytics",
    imp: "Количество игроков с triggered RG-сигналами. Регуляторное требование + этика.",
    formula: "Count of RG-flagged players", num: "Flagged", den: "—",
    b1: "Actionable list", b2: "Actionable list", b3: "Actionable list",
    red: "No follow-up in 48h", yellow: "No follow-up in 24h",
    traps: ["Over-flag снижает trust в модели", "Under-flag — регуляторный риск"],
    fix: ["Model calibration по гео", "Dedicated RG team"],
    deps: [], tags: ["ГЕО", "сегмент"], ntags: ["geo", "сегмент"]
  },
  {
    name: "Data Freshness (BI)", cat: "Data Quality", level: "L2", prio: "Must", freq: "Daily",
    owner: "Analytics", source: "BI",
    imp: "Задержка от события до появления в BI. >1h — дашборды лгут.",
    formula: "median(event_seen_at − event_happened_at)", num: "median lag", den: "—",
    b1: "<15min", b2: "<30min", b3: "<60min",
    red: ">2h", yellow: ">1h",
    traps: ["Per-pipeline freshness скрыт за aggregate"],
    fix: ["Streaming-first для critical tables", "SLA per domain"],
    deps: [], tags: [], ntags: []
  },
  {
    name: "Experiment Velocity", cat: "Experimentation", level: "L3", prio: "Nice", freq: "Monthly",
    owner: "Analytics", source: "Analytics",
    imp: "Количество завершённых A/B за период. Индикатор зрелости data-driven культуры.",
    formula: "Completed experiments / month", num: "Completed", den: "—",
    b1: ">20/mo", b2: ">12/mo", b3: ">6/mo",
    red: "<3/mo", yellow: "<8/mo",
    traps: ["Low-quality эксперименты раздувают метрику"],
    fix: ["Experiment platform", "Guardrails auto-check"],
    deps: [], tags: ["продукт"], ntags: ["продукт"]
  },
  {
    name: "Loyalty Redemption Rate", cat: "Loyalty", level: "L3", prio: "Nice", freq: "Monthly",
    owner: "CRM", source: "CRM",
    imp: "Доля заработанных loyalty-поинтов, реально использованных.",
    formula: "Redeemed / Earned", num: "Redeemed", den: "Earned",
    b1: "35–55%", b2: "30–50%", b3: "25–45%",
    red: "<15%", yellow: "<25%",
    traps: ["Breakage overvalue — не все поинты должны быть redeemable"],
    fix: ["Варианты redeem", "Напоминания о expiring points"],
    deps: [], tags: ["tier", "сегмент"], ntags: ["tier", "сегмент"]
  },
  {
    name: "Bet Latency (p95)", cat: "Sportsbook", level: "L3", prio: "Must", freq: "Daily",
    owner: "Tech", source: "Betting Engine",
    imp: "Время от нажатия 'place bet' до acceptance. Критично для live.",
    formula: "p95(bet_accepted − bet_clicked)", num: "p95 latency", den: "—",
    b1: "<1.5s", b2: "<2s", b3: "<2.5s",
    red: ">3s", yellow: ">2s",
    traps: ["Live odds-recalc увеличивает latency на спорт-события"],
    fix: ["Edge pricing", "Async acceptance UI"],
    deps: ["Uptime"], tags: ["device"], ntags: ["device"]
  },
  {
    name: "Cashout Usage Rate", cat: "Sportsbook", level: "L3", prio: "Nice", freq: "Weekly",
    owner: "Product", source: "Betting Engine",
    imp: "Доля ставок с использованным cashout. Показатель engagement и management ставок.",
    formula: "Cashouts / Settled Bets", num: "Cashouts", den: "Settled",
    b1: "8–15%", b2: "6–12%", b3: "4–10%",
    red: "<2%", yellow: "<4%",
    traps: ["Cashout offers меняют поведение — отделять от organic"],
    fix: ["UI visibility", "Fair cashout pricing"],
    deps: [], tags: ["продукт"], ntags: ["продукт"]
  },
  {
    name: "Provider Mix (top-5 share)", cat: "Casino / Games", level: "L2", prio: "Should", freq: "Monthly",
    owner: "Product", source: "Game Aggregator",
    imp: "Доля GGR в топ-5 провайдеров. Концентрация vs диверсификация.",
    formula: "Top-5 Provider GGR / Total Casino GGR", num: "Top-5", den: "Total",
    b1: "50–70%", b2: "55–75%", b3: "60–80%",
    red: ">85% (concentration)", yellow: ">75%",
    traps: ["Один мега-хит провайдера — норма, не проблема"],
    fix: ["Onboard emerging providers", "Featured carousel rotation"],
    deps: ["Total Wager (Casino)"], tags: ["провайдер"], ntags: ["провайдер"]
  },
  {
    name: "Game RTP Variance", cat: "Casino / Games", level: "L3", prio: "Should", freq: "Weekly",
    owner: "Product", source: "Game Aggregator",
    imp: "Отклонение фактического RTP от теоретического по играм. Ловит калибровочные ошибки провайдеров.",
    formula: "|actual RTP − theoretical RTP| по игре", num: "Deviation", den: "—",
    b1: "<0.3 p.p.", b2: "<0.5 p.p.", b3: "<0.8 p.p.",
    red: ">1 p.p.", yellow: ">0.6 p.p.",
    traps: ["Малый N (<10k спинов) даёт шум"],
    fix: ["Alert per game", "Escalate к провайдеру"],
    deps: ["Total Wager (Casino)"], tags: ["провайдер", "игра"], ntags: ["провайдер", "игра"]
  },
  {
    name: "Push Opt-in Rate", cat: "CRM", level: "L3", prio: "Nice", freq: "Monthly",
    owner: "CRM", source: "CRM",
    imp: "Доля игроков, согласившихся на push-уведомления. База для triggered-кампаний.",
    formula: "Opted-in / Registered", num: "Opted-in", den: "Registered",
    b1: "40–60%", b2: "35–55%", b3: "30–50%",
    red: "<20%", yellow: "<30%",
    traps: ["iOS vs Android — разные floors", "Prompt-timing влияет"],
    fix: ["Soft-ask pattern", "Value-first messaging"],
    deps: [], tags: ["device"], ntags: ["device"]
  },
  {
    name: "Fraud Capture Rate", cat: "Risk / Antifraud", level: "L3", prio: "Must", freq: "Weekly",
    owner: "Risk", source: "Analytics",
    imp: "Доля confirmed fraud, пойманного pre-payout vs post-incident.",
    formula: "Caught Pre-payout / Total Fraud", num: "Pre-payout", den: "Total",
    b1: ">85%", b2: ">78%", b3: ">70%",
    red: "<60%", yellow: "<75%",
    traps: ["False positives блокируют легитимных — баланс важен"],
    fix: ["Rule-tuning ежеквартально", "ML-скоринг по сессии"],
    deps: ["Chargeback Rate"], tags: ["метод платежа", "ГЕО"], ntags: ["метод платежа", "geo"]
  },
  {
    name: "New Registrations", cat: "Acquisition (UA)", level: "L2", prio: "Must", freq: "Daily",
    owner: "Marketing", source: "Analytics",
    imp: "Поток новых регистраций. Вход в воронку FTD.",
    formula: "Count of new accounts", num: "Count", den: "—",
    b1: "Depends on scale", b2: "Depends on scale", b3: "Depends on scale",
    red: "Drop >20% WoW", yellow: "Drop >10%",
    traps: ["Bot-регистрации — чистить"],
    fix: ["Traffic mix audit", "CAPTCHA на подозрительный трафик"],
    deps: ["Reg→FTD Conversion", "FTD Count"], tags: ["канал", "ГЕО"], ntags: ["канал", "geo"]
  },
  {
    name: "Bonus Abuse Rate", cat: "Risk / Antifraud", level: "L3", prio: "Should", freq: "Weekly",
    owner: "Risk", source: "Bonus Engine",
    imp: "Доля bonus-клеймов с подозрительным поведением (multi-acc, low-risk bets).",
    formula: "Flagged Bonus Claims / Total", num: "Flagged", den: "Total",
    b1: "<3%", b2: "<5%", b3: "<7%",
    red: ">10%", yellow: ">6%",
    traps: ["Narrow-minded rules ловят power-users"],
    fix: ["Device fingerprinting", "Wagering game weights"],
    deps: ["Bonus Cost Ratio"], tags: ["Тип бонуса", "device"], ntags: ["тип бонуса", "device"]
  },
  {
    name: "Session Duration (median)", cat: "Funnel (Product)", level: "L3", prio: "Nice", freq: "Weekly",
    owner: "Product", source: "Analytics",
    imp: "Медиана длительности сессии. Engagement-прокси.",
    formula: "median(session_end − session_start)", num: "median", den: "—",
    b1: "12–25 min", b2: "10–20 min", b3: "8–18 min",
    red: "<5 min", yellow: "<8 min",
    traps: ["Background-сессии раздувают метрику", "Desktop vs mobile разная базовая норма"],
    fix: ["Timeout-tuning", "Engagement-фичи"],
    deps: [], tags: ["device", "сегмент"], ntags: ["device", "сегмент"]
  },
  {
    name: "Geo Mix of NGR", cat: "Revenue", level: "L2", prio: "Should", freq: "Monthly",
    owner: "Finance", source: "BI",
    imp: "Распределение NGR по гео. Концентрационный риск и диверсификация.",
    formula: "NGR per country / Total NGR", num: "Country NGR", den: "Total NGR",
    b1: "Top-3 <60%", b2: "Top-3 <70%", b3: "Top-3 <80%",
    red: "Top-1 >50%", yellow: "Top-1 >40%",
    traps: ["Регуляторные изменения в одной юрисдикции обнуляют часть NGR"],
    fix: ["Geo-diversification plan", "License portfolio"],
    deps: ["NGR"], tags: ["ГЕО"], ntags: ["geo"]
  },
  {
    name: "Bet Count per DAU", cat: "Sportsbook", level: "L3", prio: "Nice", freq: "Daily",
    owner: "Product", source: "Betting Engine",
    imp: "Среднее число ставок на активного игрока. Engagement в спортсбуке.",
    formula: "Total Bets / DAU", num: "Total Bets", den: "DAU",
    b1: "2–5", b2: "1.5–4", b3: "1–3",
    red: "<0.8", yellow: "<1.5",
    traps: ["Live-сессии дают всплески — отделять pre-match"],
    fix: ["Bet builder UX", "In-session promo"],
    deps: ["DAU"], tags: ["продукт"], ntags: ["продукт"]
  }
];
