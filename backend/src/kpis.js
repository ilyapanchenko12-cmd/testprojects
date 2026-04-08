import { db } from './db.js';
import { buildDemoKpis } from './demoKpis.js';
import { chatIdBindingCandidates } from './telegramChatId.js';

const FX_TO_USD = {
    usd: 1,
    usdt: 1,
    '$': 1,
    eur: 1.08,
    gbp: 1.27,
    chf: 1.11,
    cad: 0.74,
    aud: 0.66,
    nzd: 0.61,
    jpy: 0.0067,
    cny: 0.14,
    hkd: 0.128,
    sgd: 0.74,
    aed: 0.272,
    sar: 0.267,
    qar: 0.275,
    kwd: 3.25,
    bhd: 2.65,
    omr: 2.6,
    ils: 0.27,
    try: 0.031,
    rub: 0.011,
    uah: 0.024,
    kzt: 0.0021,
    uzs: 0.000079,
    gel: 0.37,
    amd: 0.0026,
    azn: 0.59,
    byn: 0.31,
    inr: 0.012,
    pkr: 0.0036,
    bdt: 0.0082,
    lkr: 0.0033,
    idr: 0.000062,
    vnd: 0.000039,
    thb: 0.027,
    myr: 0.21,
    php: 0.018,
    krw: 0.00074,
    twd: 0.031,
    zar: 0.055,
    egp: 0.02,
    ngn: 0.0007,
    kes: 0.0077,
    ghs: 0.064,
    ars: 0.007175,
    ar: 0.007175,
    'ars$': 0.007175,
    brl: 0.2,
    clp: 0.001,
    cop: 0.00025,
    pen: 0.27,
    sol: 0.27,
    uyu: 0.025,
    bob: 0.145,
    pyg: 0.00013,
    mxn: 0.059,
    dop: 0.017,
    crc: 0.0019
};
const CURRENCY_ALIASES = {
    доллар: 'usd',
    доллары: 'usd',
    евро: 'eur',
    руб: 'rub',
    рубль: 'rub',
    грн: 'uah',
    тенге: 'kzt',
    лира: 'try',
    дирхам: 'aed',
    песо: 'ars',
    real: 'brl',
    sol: 'sol'
};
const MONEY_METRIC_KEYS = new Set(['spend', 'revenue', 'fdSum', 'rdSum', 'revenueMonth', 'costs', 'payroll', 'netProfit']);

/** Нормализация названия проекта из текста отчёта → ключ селектора CRM (peru2, …). */
export function slugifyProjectLabel(label) {
    if (!label) return '';
    const t = String(label)
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[^\w\u0400-\u04FF]/g, '');
    if (/перу1|peru1/.test(t)) return 'peru1';
    if (/перу2|peru2/.test(t)) return 'peru2';
    if (/аргентин|argentina/.test(t)) return 'argentina';
    if (/мексик|mexico/.test(t)) return 'mexico';
    if (/чили|chile/.test(t)) return 'chile';
    if (/итали|italy/.test(t)) return 'italy';
    return '';
}

function slugMetricKey(k) {
    return String(k)
        .toLowerCase()
        .replace(/[\s\u00A0]+/g, '')
        .replace(/_/g, '');
}

/** Синонимы → каноническое имя поля как в buildDemoKpis. */
const SLUG_TO_CANON = {
    spend: 'spend',
    спенд: 'spend',
    adspend: 'spend',
    расход: 'spend',
    реклама: 'spend',
    spendplan: 'spendPlan',
    планспенда: 'spendPlan',
    план: 'spendPlan',
    chats: 'chats',
    чаты: 'chats',
    чатов: 'chats',
    pdp: 'pdp',
    подписки: 'pdp',
    fd: 'fd',
    фд: 'fd',
    firstdeposit: 'fd',
    firstdeposits: 'fd',
    колфд: 'fd',
    количествофд: 'fd',
    fds: 'fd',
    rd: 'rd',
    rdsum: 'rdSum',
    sumrd: 'rdSum',
    totalrd: 'rdSum',
    суммаrd: 'rdSum',
    суммард: 'rdSum',
    rdamount: 'rdSum',
    revenuefromrd: 'rdSum',
    revenue: 'revenue',
    выручка: 'revenue',
    доход: 'revenue',
    опервыручка: 'revenue',
    rev: 'revenue',
    revenuetotal: 'revenue',
    totalrevenue: 'revenue',
    netrevenue: 'revenue',
    выручкаопер: 'revenue',
    выручказадень: 'revenue',
    выручкасутки: 'revenue',
    fdsum: 'fdSum',
    fdamount: 'fdSum',
    sumfd: 'fdSum',
    totalfd: 'fdSum',
    суммаfd: 'fdSum',
    суммафд: 'fdSum',
    суммаfdusd: 'fdSum',
    суммафдusd: 'fdSum',
    депозитыfd: 'fdSum',
    revenuemonth: 'revenueMonth',
    выручкамес: 'revenueMonth',
    costs: 'costs',
    косты: 'costs',
    расходы: 'costs',
    payroll: 'payroll',
    фот: 'payroll',
    netprofit: 'netProfit',
    прибыль: 'netProfit',
    чистаяприбыль: 'netProfit',
    roi: 'roi',
    ltv: 'ltv',
    ltvdays: 'ltvDays',
    sub2dia: 'sub2dia',
    dia2fd: 'dia2fd',
    fd2rd: 'fd2rd',
    cashplanpct: 'cashPlanPct',
    касса: 'cashPlanPct',
    планкассы: 'cashPlanPct',
    dialogs: 'dialogs',
    диалоги: 'dialogs',
    deposits: 'deposits',
    депозиты: 'deposits',
    paymentscount: 'paymentsCount',
    оплат: 'paymentsCount',
    ctrbuttons: 'ctrButtons',
    buttonclicks: 'buttonClicks',
    клики: 'buttonClicks',
    unsubrate: 'unsubRate'
};

function toCanonicalKey(rawKey) {
    const sl = slugMetricKey(rawKey);
    if (SLUG_TO_CANON[sl]) return SLUG_TO_CANON[sl];
    if (sl === 'пдп') return 'pdp';
    return null;
}

/** Приводим значение к числу; проценты «94%» → 94 для кассы или 0.94 для долей — эвристика. */
function coerceNumber(val, canonKey) {
    if (val == null) return null;
    if (typeof val === 'number' && Number.isFinite(val)) {
        if (['sub2dia', 'dia2fd', 'fd2rd', 'cashPlanPct', 'ctrButtons', 'unsubRate'].includes(canonKey)) {
            if (val > 1 && val <= 100) return val / 100;
            return val;
        }
        return val;
    }
    const s = String(val).replace(/\s/g, '').replace(',', '.');
    const pct = s.endsWith('%');
    const n = parseFloat(pct ? s.slice(0, -1) : s);
    if (!Number.isFinite(n)) return null;
    if (['sub2dia', 'dia2fd', 'fd2rd', 'cashPlanPct', 'ctrButtons', 'unsubRate'].includes(canonKey)) {
        if (pct || (n > 1 && n <= 100 && canonKey !== 'ltv')) return n / 100;
        return n;
    }
    return n;
}

function rowMatchesDashboardProject(dashboardKey, chatId, extractProject) {
    if (dashboardKey === 'all') return true;
    const stmt = db.prepare(`SELECT 1 AS o FROM channel_project_map WHERE chat_id = ? AND dashboard_key = ?`);
    for (const cid of chatIdBindingCandidates(chatId)) {
        if (stmt.get(cid, dashboardKey)) return true;
    }
    const slug = slugifyProjectLabel(extractProject);
    if (slug && slug === dashboardKey) return true;
    return false;
}

function resolveDashboardProjectKey(chatId, extractProject) {
    const slug = slugifyProjectLabel(extractProject);
    if (slug) return slug;
    const stmt = db.prepare(`SELECT dashboard_key FROM channel_project_map WHERE chat_id = ? LIMIT 1`);
    for (const cid of chatIdBindingCandidates(chatId)) {
        const row = stmt.get(cid);
        if (row?.dashboard_key) return String(row.dashboard_key);
    }
    return '';
}

function normalizePersonKey(v) {
    return String(v || '')
        .trim()
        .toLowerCase()
        .replace(/^@/, '')
        .replace(/\s+/g, ' ');
}
export function normalizeProcessorKey(v) {
    const n = normalizePersonKey(v);
    return n || 'all';
}
export function normalizeBuyerKey(v) {
    const n = normalizePersonKey(v);
    return n || 'all';
}

function extractProcessorName(row) {
    let full = null;
    try {
        full = row.full_json ? JSON.parse(row.full_json) : null;
    } catch {
        full = null;
    }
    const byReport =
        full?.processor_name ||
        full?.processor ||
        full?.author_hint ||
        full?.author ||
        full?.meta?.processor ||
        null;
    const tg = row.username || null;
    const raw = byReport || tg || null;
    if (!raw) return null;
    const key = normalizePersonKey(raw);
    return key ? String(raw).trim() : null;
}

function extractBuyerName(row) {
    let full = null;
    try {
        full = row.full_json ? JSON.parse(row.full_json) : null;
    } catch {
        full = null;
    }
    const byReport =
        full?.buyer_name ||
        full?.buyer ||
        full?.author_hint ||
        full?.author ||
        full?.meta?.buyer ||
        null;
    const tg = row.username || null;
    const raw = byReport || tg || null;
    if (!raw) return null;
    const key = normalizePersonKey(raw);
    return key ? String(raw).trim() : null;
}

function extractCurrencyRate(row) {
    return 1;
}

function extractFlowKind(row) {
    let full = null;
    try {
        full = row.full_json ? JSON.parse(row.full_json) : null;
    } catch {
        full = null;
    }
    const txt = String(full?.raw_preserve || '').toLowerCase();
    const hint = String(full?.author_hint || '').toLowerCase();
    const mix = `${txt} ${hint}`;
    if (/баер|buy/i.test(mix)) return 'buying';
    if (/обработ|processing/i.test(mix)) return 'processing';
    return 'other';
}

/**
 * Ключи, которые **суммируются** по всем подходящим отчётам (инкременты / несколько постов в канале).
 * Планы, доли и «снимок» P&L — берём последнее значение (см. METRIC_LATEST).
 */
export const METRIC_SUM_KEYS = new Set([
    'spend',
    'revenue',
    'fdSum',
    'rdSum',
    'fd',
    'rd',
    'chats',
    'pdp',
    'deposits',
    'dialogs',
    'paymentsCount',
    'buttonClicks'
]);

const METRIC_LATEST_KEYS = new Set([
    'spendPlan',
    'sub2dia',
    'dia2fd',
    'fd2rd',
    'cashPlanPct',
    'ctrButtons',
    'unsubRate',
    'roi',
    'ltv',
    'ltvDays',
    'revenueMonth',
    'costs',
    'payroll',
    'netProfit'
]);

/** Собираем метрики из отчётов: суммы по METRIC_SUM_KEYS, остальное — последний отчёт (новее = выше id). */
export function aggregateLiveMetrics(
    dashboardKey,
    buyerFilter = 'all',
    processorFilter = 'all',
    period = 'today',
    reportDate = null,
    dateFrom = null,
    dateTo = null
) {
    if (!dashboardKey) return {};
    const buyerKey = normalizePersonKey(buyerFilter);
    const processorKey = normalizePersonKey(processorFilter);
    const safeDate = /^\d{4}-\d{2}-\d{2}$/.test(String(reportDate || '').trim()) ? String(reportDate).trim() : null;
    const safeFrom = /^\d{4}-\d{2}-\d{2}$/.test(String(dateFrom || '').trim()) ? String(dateFrom).trim() : null;
    const safeTo = /^\d{4}-\d{2}-\d{2}$/.test(String(dateTo || '').trim()) ? String(dateTo).trim() : null;
    // День считаем по МСК (UTC+3), независимо от системного TZ.
    const mskDateExpr = `date(datetime(e.created_at, '+3 hours'))`;
    const periodSql = safeFrom && safeTo
        ? `AND ${mskDateExpr} BETWEEN '${safeFrom}' AND '${safeTo}'`
        : safeFrom
          ? `AND ${mskDateExpr} >= '${safeFrom}'`
          : safeTo
            ? `AND ${mskDateExpr} <= '${safeTo}'`
            : safeDate
              ? `AND ${mskDateExpr} = '${safeDate}'`
              : period === '7d'
                ? `AND ${mskDateExpr} >= date(datetime('now', '+3 hours', '-6 days'))`
                : period === '30d'
                  ? `AND ${mskDateExpr} >= date(datetime('now', '+3 hours', '-29 days'))`
                  : `AND ${mskDateExpr} = date(datetime('now', '+3 hours'))`;

    const rows = db
        .prepare(
            `SELECT e.id, e.metrics_json, e.project, e.full_json, e.created_at AS created_at, ${mskDateExpr} AS msk_day, m.chat_id AS chat_id, m.username AS username, m.user_id AS user_id
       FROM fin_report_extracts e
       JOIN telegram_messages m ON m.id = e.message_id
       WHERE e.metrics_json IS NOT NULL
         AND TRIM(e.metrics_json) != ''
         AND TRIM(e.metrics_json) != '{}'
         AND (e.report_type IS NULL OR e.report_type != 'noise')
         ${periodSql}
       ORDER BY e.id DESC
       LIMIT 120`
        )
        .all();

    const sums = new Map();
    const latest = new Map();
    const seenByProjectFlowDay = new Set();

    for (const row of rows) {
        if (!rowMatchesDashboardProject(dashboardKey, row.chat_id, row.project)) continue;
        const flow = extractFlowKind(row);
        if (buyerKey && buyerKey !== 'all' && flow === 'buying') {
            const person = extractBuyerName(row);
            if (!person || normalizePersonKey(person) !== buyerKey) continue;
        }
        if (processorKey && processorKey !== 'all') {
            const person = flow === 'processing' ? extractProcessorName(row) : null;
            if (!person || normalizePersonKey(person) !== processorKey) continue;
        }
        // Если один и тот же юзер шлёт несколько отчётов за день — учитываем только самый последний.
        const day = String(row.msk_day || '').slice(0, 10);
        const projectKey = resolveDashboardProjectKey(row.chat_id, row.project);
        if (!projectKey) continue;
        const flowKey = flow;
        // Берем только один (самый новый) отчет по проекту+потоку за день.
        const dedupeKey = `${day}|${projectKey}|${flowKey}`;
        if (seenByProjectFlowDay.has(dedupeKey)) continue;
        seenByProjectFlowDay.add(dedupeKey);
        let metrics;
        try {
            metrics = JSON.parse(row.metrics_json);
        } catch {
            continue;
        }
        if (!metrics || typeof metrics !== 'object') continue;
        for (const [rawK, rawV] of Object.entries(metrics)) {
            const canon = toCanonicalKey(rawK);
            if (!canon) continue;
            let num = coerceNumber(rawV, canon);
            if (num == null) continue;
            if (MONEY_METRIC_KEYS.has(canon)) {
                const fx = extractCurrencyRate(row);
                num = num * fx;
            }

            if (METRIC_SUM_KEYS.has(canon)) {
                sums.set(canon, (sums.get(canon) || 0) + num);
            } else if (METRIC_LATEST_KEYS.has(canon)) {
                if (!latest.has(canon)) latest.set(canon, num);
            } else {
                if (!latest.has(canon)) latest.set(canon, num);
            }
        }
    }

    const out = { ...Object.fromEntries(latest) };
    for (const [k, v] of sums) {
        out[k] = v;
    }

    /**
     * Выручка по правилу D7: сумма(fdSum + rdSum) − сумма(spend) по всем отчётам проекта.
     * Если rdSum нет, считаем как fdSum − spend.
     * Иначе остаётся сумма явных полей revenue (если в отчётах нет пары сумм+спенд).
     */
    const sumFd = sums.get('fdSum');
    const sumRd = sums.get('rdSum');
    const sumSp = sums.get('spend');
    if (sumFd != null && sumSp != null && Number.isFinite(sumFd) && Number.isFinite(sumSp)) {
        const rdPart = Number.isFinite(sumRd) ? sumRd : 0;
        out.revenue = sumFd + rdPart - sumSp;
    }
    const sumPdp = sums.get('pdp');
    const sumFdCount = sums.get('fd');
    const sumRdCount = sums.get('rd');
    if (sumSp != null && sumPdp != null && Number.isFinite(sumSp) && Number.isFinite(sumPdp) && sumPdp > 0) {
        out.pdpPrice = sumSp / sumPdp;
    }
    if (sumSp != null && sumFdCount != null && Number.isFinite(sumSp) && Number.isFinite(sumFdCount) && sumFdCount > 0) {
        out.fdPrice = sumSp / sumFdCount;
    }
    if (sumSp != null && sumRdCount != null && Number.isFinite(sumSp) && Number.isFinite(sumRdCount) && sumRdCount > 0) {
        out.rdPrice = sumSp / sumRdCount;
    }

    // Производные KPI для "ROI / Выручка / Чистая прибыль" из отчётов.
    const revenue = Number.isFinite(out.revenue) ? out.revenue : null;
    const spend = Number.isFinite(sumSp) ? sumSp : Number.isFinite(out.spend) ? out.spend : null;
    const costs = Number.isFinite(out.costs) ? out.costs : 0;
    const payroll = Number.isFinite(out.payroll) ? out.payroll : 0;
    if (revenue != null) {
        out.revenueMonth = revenue;
        out.netProfit = revenue - costs - payroll;
    }
    if (revenue != null && spend != null && spend > 0) {
        out.roi = revenue / spend;
    }

    if (safeDate) {
        const ovr = db
            .prepare(
                `SELECT metrics_json FROM daily_kpi_overrides
                 WHERE report_date = ? AND dashboard_key = ? AND processor_key = ?`
            )
            .get(safeDate, dashboardKey, normalizeProcessorKey(processorFilter));
        if (ovr?.metrics_json) {
            try {
                const parsed = JSON.parse(ovr.metrics_json);
                if (parsed && typeof parsed === 'object') Object.assign(out, parsed);
            } catch {
                /* ignore bad override json */
            }
        }
    }

    return out;
}

export function listLiveProcessors(dashboardKey = 'all') {
    const rows = db
        .prepare(
            `SELECT e.project, e.full_json, m.chat_id AS chat_id, m.username AS username
       FROM fin_report_extracts e
       JOIN telegram_messages m ON m.id = e.message_id
       WHERE (e.report_type IS NULL OR e.report_type != 'noise')
       ORDER BY e.id DESC
       LIMIT 300`
        )
        .all();
    const out = new Map();
    for (const row of rows) {
        if (dashboardKey && dashboardKey !== 'all' && !rowMatchesDashboardProject(dashboardKey, row.chat_id, row.project)) {
            continue;
        }
        const name = extractProcessorName(row);
        const key = normalizePersonKey(name);
        if (!name || !key) continue;
        if (!out.has(key)) out.set(key, name);
    }
    return [...out.entries()].map(([value, label]) => ({ value, label }));
}

export function listLiveBuyers(dashboardKey = 'all') {
    const rows = db
        .prepare(
            `SELECT e.project, e.full_json, m.chat_id AS chat_id, m.username AS username
       FROM fin_report_extracts e
       JOIN telegram_messages m ON m.id = e.message_id
       WHERE (e.report_type IS NULL OR e.report_type != 'noise')
       ORDER BY e.id DESC
       LIMIT 300`
        )
        .all();
    const out = new Map();
    for (const row of rows) {
        if (dashboardKey && dashboardKey !== 'all' && !rowMatchesDashboardProject(dashboardKey, row.chat_id, row.project)) {
            continue;
        }
        if (extractFlowKind(row) !== 'buying') continue;
        const name = extractBuyerName(row);
        const key = normalizePersonKey(name);
        if (!name || !key) continue;
        if (!out.has(key)) out.set(key, name);
    }
    return [...out.entries()].map(([value, label]) => ({ value, label }));
}

/** Ключи «главного» финблока админки — подсказка для UI и отчётов. */
export const ADMIN_PRIMARY_METRIC_KEYS = ['spend', 'revenue', 'fd', 'fdSum'];

export function buildMergedKpisForRole(role, filterCtx = {}) {
    const demo = buildDemoKpis(role, filterCtx);
    const dashboardKey = filterCtx.project || 'all';
    const live = aggregateLiveMetrics(
        dashboardKey,
        filterCtx.buyer || 'all',
        filterCtx.processor || 'all',
        filterCtx.period || 'today',
        filterCtx.reportDate || null,
        filterCtx.dateFrom || null,
        filterCtx.dateTo || null
    );
    // Для режима "все проекты" показываем только live-агрегацию, без демо-подмешивания.
    const merged = dashboardKey === 'all' ? {} : { ...demo };
    const liveKeys = [];
    for (const [k, v] of Object.entries(live)) {
        if (v != null && typeof v === 'number' && Number.isFinite(v)) {
            merged[k] = v;
            liveKeys.push(k);
        }
    }
    const source = liveKeys.length ? 'mixed' : 'demo';
    return {
        merged,
        demo,
        live,
        liveKeys,
        source,
        primaryMetricKeys: role === 'ADMIN' ? ADMIN_PRIMARY_METRIC_KEYS : []
    };
}
