import { db } from './db.js';
import { slugifyProjectLabel } from './kpis.js';

function toNum(v) {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    const n = parseFloat(String(v ?? '').replace(/\s/g, '').replace(',', '.'));
    return Number.isFinite(n) ? n : null;
}

function normalizeAmount(raw) {
    if (raw == null) return null;
    const s0 = String(raw).trim();
    if (!s0) return null;
    const s = s0.replace(/\s/g, '').replace(',', '.');
    if (!/^[-+]?\d*\.?\d+$/.test(s)) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
}

function extractMetricFromText(text, patterns) {
    for (const re of patterns) {
        const m = re.exec(text);
        if (!m) continue;
        const v = normalizeAmount(m[1]);
        if (v != null) return v;
    }
    return null;
}

function extractDeterministicMetricsFromText(sourceText) {
    const t = String(sourceText || '').toLowerCase();
    if (!t.trim()) return {};
    const out = {};
    const spend = extractMetricFromText(t, [
        /(?:спенд|spend)\s*[:=-]?\s*(\d+(?:[.,]\d+)?)/i
    ]);
    if (spend != null) out.spend = spend;

    const pdp = extractMetricFromText(t, [
        /(?:пдп|подпис(?:ки|ок)?|pdp)\s*[:=-]?\s*(\d+(?:[.,]\d+)?)/i
    ]);
    if (pdp != null) out.pdp = pdp;

    const fd = extractMetricFromText(t, [
        /(?:кол[-\s]*во\s*)?(?:фд|fd)\s*(?:шт|pieces|count)\s*[:=-]?\s*(\d+(?:[.,]\d+)?)/i,
        /(?:кол[-\s]*во\s*)(?:фд|fd)\s*[:=-]?\s*(\d+(?:[.,]\d+)?)/i,
        /(?:^|[|,;\n\r])\s*(?:фд|fd)\s*[:=-]\s*(\d+(?:[.,]\d+)?)/i
    ]);
    if (fd != null) out.fd = fd;

    const rd = extractMetricFromText(t, [
        /(?:кол[-\s]*во\s*)?(?:рд|rd)\s*(?:шт|pieces|count)\s*[:=-]?\s*(\d+(?:[.,]\d+)?)/i,
        /(?:кол[-\s]*во\s*)(?:рд|rd)\s*[:=-]?\s*(\d+(?:[.,]\d+)?)/i,
        /(?:^|[|,;\n\r])\s*(?:рд|rd)\s*[:=-]\s*(\d+(?:[.,]\d+)?)/i
    ]);
    if (rd != null) out.rd = rd;

    const fdSum = extractMetricFromText(t, [
        /(?:[cс]умма|sum)\s*(?:фд|fd)\s*(?:\$|usd|долл\w*)?\s*[:=-]?\s*(\d+(?:[.,]\d+)?)/i,
        /(?:[cс]умма\s*депозит\w*|fdsum|sumfd)\s*[:=-]?\s*(\d+(?:[.,]\d+)?)/i
    ]);
    if (fdSum != null) out.fdSum = fdSum;

    const rdSum = extractMetricFromText(t, [
        /(?:[cс]умма|sum)\s*(?:рд|rd)\s*(?:\$|usd|долл\w*)?\s*[:=-]?\s*(\d+(?:[.,]\d+)?)/i,
        /(?:rdsum|sumrd)\s*[:=-]?\s*(\d+(?:[.,]\d+)?)/i
    ]);
    if (rdSum != null) out.rdSum = rdSum;
    return out;
}

/** Сохраняет нормализованную строку отчёта после парсинга JSON из модели. */
export function persistFinReportExtract(messageId, structuredText, model, opts = {}) {
    const chatId = opts.chatId != null ? String(opts.chatId) : null;
    const bindingKey = opts.dashboardKeyFromBinding || null;

    let obj;
    try {
        obj = JSON.parse(structuredText);
    } catch {
        return null;
    }
    const metrics = obj.metrics && typeof obj.metrics === 'object' ? { ...obj.metrics } : {};
    const roleHint = String(opts.roleHint || '').toLowerCase();
    const sourceText = String(opts.sourceText || '').toLowerCase();
    const deterministic = extractDeterministicMetricsFromText(sourceText);
    for (const [k, v] of Object.entries(deterministic)) {
        metrics[k] = v;
    }
    // Баинг иногда ошибочно складывает подписки в fd — переносим в pdp.
    if (
        (metrics.fd != null || metrics.fdSum != null) &&
        (metrics.pdp == null || !Number.isFinite(toNum(metrics.pdp))) &&
        /(пдп|подпис)/i.test(sourceText)
    ) {
        const fdAsCount = toNum(metrics.fd);
        const fdSumAsMaybeCount = toNum(metrics.fdSum);
        metrics.pdp = fdAsCount != null ? fdAsCount : fdSumAsMaybeCount;
        delete metrics.fd;
        delete metrics.fdSum;
    }

    // Конвертацию отключили: считаем, что все денежные метрики уже приходят в USD.
    obj.currency = 'USD';
    obj.metrics_in_usd = true;
    const hasNumericMetrics =
        metrics &&
        typeof metrics === 'object' &&
        Object.keys(metrics).length > 0 &&
        Object.values(metrics).some((v) => {
            if (v == null) return false;
            if (typeof v === 'number' && Number.isFinite(v)) return true;
            const n = parseFloat(String(v).replace(/\s/g, '').replace(',', '.'));
            return Number.isFinite(n);
        });

    let reportType =
        obj.report_type ?? obj.reportType ?? (hasNumericMetrics ? 'ad_hoc' : 'noise');
    if (hasNumericMetrics && (reportType === 'noise' || !reportType)) {
        reportType = 'ad_hoc';
    }

    let project = obj.project ?? obj.project_name ?? null;
    if (!project) {
        const geoAsProject = slugifyProjectLabel(obj.geo ?? obj.country ?? null);
        if (geoAsProject) {
            project = geoAsProject;
        }
    }
    if (bindingKey) {
        project = bindingKey;
    }
    if (project) {
        // Новый отчёт приоритетнее ручного оверрайда: показываем фактические суммы из бота.
        db.prepare(
            `DELETE FROM daily_kpi_overrides
             WHERE report_date = date('now') AND dashboard_key = ?`
        ).run(String(project));
    }
    const geo = obj.geo ?? obj.country ?? null;
    const periodLabel =
        obj.period?.label ?? obj.period_label ?? (typeof obj.period === 'string' ? obj.period : null);
    const summary =
        obj.summary_one_line ?? obj.summary ?? obj.summaryOneLine ?? null;
    const metricsJson = JSON.stringify(metrics);

    const ins = db.prepare(`
    INSERT INTO fin_report_extracts (
      message_id, report_type, project, geo, period_label, summary_one_line, metrics_json, full_json, model, chat_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
    const info = ins.run(
        messageId,
        reportType ? String(reportType).slice(0, 64) : null,
        project ? String(project).slice(0, 128) : null,
        geo ? String(geo).slice(0, 64) : null,
        periodLabel ? String(periodLabel).slice(0, 128) : null,
        summary ? String(summary).slice(0, 512) : null,
        metricsJson,
        JSON.stringify(obj).slice(0, 62000),
        model || null,
        chatId
    );
    return info.lastInsertRowid;
}
