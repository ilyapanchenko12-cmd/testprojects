import express from 'express';
import { db, getPrompt, setPrompt } from './db.js';
import { geminiGenerate } from './ai.js';
import { buildMergedKpisForRole, listLiveBuyers, listLiveProcessors, normalizeProcessorKey } from './kpis.js';

export const apiRouter = express.Router();

apiRouter.post('/auth/login', express.json({ limit: '16kb' }), (req, res) => {
    try {
        const email = String(req.body?.email || '')
            .trim()
            .toLowerCase();
        const password = String(req.body?.password || '').trim();
        if (!email || !password) return res.status(400).json({ error: 'email и password обязательны' });
        const row = db
            .prepare(`SELECT email, role, name FROM crm_users WHERE lower(email) = ? AND password = ? LIMIT 1`)
            .get(email, password);
        if (!row) return res.status(401).json({ error: 'Неверный логин или пароль' });
        res.json({
            ok: true,
            user: {
                id: row.email,
                email: row.email,
                name: row.name || row.email,
                role: row.role || 'ADMIN'
            }
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message || 'auth error' });
    }
});

function checkPromptSecret(req, res, next) {
    const secret = process.env.CRM_API_SECRET;
    if (!secret) return next();
    if (req.get('X-CRM-SECRET') !== secret) {
        return res.status(403).json({ error: 'Неверный X-CRM-SECRET' });
    }
    next();
}

apiRouter.get('/health', (req, res) => {
    res.json({
        ok: true,
        gemini: Boolean(process.env.GEMINI_API_KEY),
        telegram: Boolean(process.env.TELEGRAM_BOT_TOKEN)
    });
});

apiRouter.get('/prompt/:id', (req, res) => {
    const row = getPrompt(req.params.id);
    if (!row) return res.status(404).json({ error: 'not found' });
    res.json(row);
});

apiRouter.put('/prompt/:id', express.json({ limit: '512kb' }), checkPromptSecret, (req, res) => {
    const body = req.body?.body;
    if (typeof body !== 'string' || !body.trim()) {
        return res.status(400).json({ error: 'body required' });
    }
    setPrompt(req.params.id, body.trim());
    res.json(getPrompt(req.params.id));
});

apiRouter.post('/ai/dashboard', express.json({ limit: '256kb' }), async (req, res) => {
    try {
        const { userEmail, role, filterCtx } = req.body || {};
        if (!role) return res.status(400).json({ error: 'role required' });

        const main = getPrompt('main');
        const { merged: kpis, source: kpiSource, liveKeys } = buildMergedKpisForRole(role, filterCtx || {});
        const payload = {
            userEmail: userEmail || null,
            role,
            filterCtx: filterCtx || {},
            kpis,
            kpiSource,
            liveKeys,
            note:
                kpiSource === 'mixed'
                    ? 'Часть метрик из отчётов Telegram/каналов по выбранному проекту; остальное — демо-заполнение.'
                    : 'Метрики демо. Привяжите канал к проекту и пришлите отчёт — появятся живые цифры.'
        };

        const { text, model } = await geminiGenerate({
            systemInstruction: main.body,
            userPayload: payload
        });

        const key = `${userEmail || 'anon'}|${role}`;
        db.prepare(
            `INSERT INTO ai_insights (context_type, context_key, body, model, meta_json)
       VALUES ('dashboard', ?, ?, ?, ?)`
        ).run(key, text, model, JSON.stringify({ filterCtx: filterCtx || {} }));

        res.json({ text, model });
    } catch (e) {
        console.error(e);
        if (e.code === 'NO_KEY') return res.status(503).json({ error: e.message });
        res.status(500).json({ error: e.message || 'AI error' });
    }
});

apiRouter.get('/advice', async (req, res) => {
    try {
        const email = (req.query.email || '').toString();
        const role = (req.query.role || '').toString();
        const refresh = req.query.refresh === '1' || req.query.refresh === 'true';
        if (!role) return res.status(400).json({ error: 'role required' });

        const key = `${email || 'anon'}|${role}`;
        if (!refresh) {
            const last = db
                .prepare(
                    `SELECT body, created_at FROM ai_insights
           WHERE context_type = 'advice' AND context_key = ?
           ORDER BY id DESC LIMIT 1`
                )
                .get(key);
            if (last) return res.json({ text: last.body, cached: true, created_at: last.created_at });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.json({
                text: 'ИИ отключён: задайте GEMINI_API_KEY в backend/.env и перезапустите сервер.',
                cached: false
            });
        }

        const main = getPrompt('main');
        const { merged: kpis } = buildMergedKpisForRole(role, { project: 'all', periodLabel: 'today' });
        const adviceInstruction = `${main.body}

Сейчас задача: персональные советы при входе в кабинет.
Пользователь: ${email || 'не указан'}, роль: ${role}.
Дай 4–6 коротких пунктов (маркированный список): что сделать сегодня/на неделе исходя из метрик (в т.ч. из отчётов, если есть).
Тон: поддерживающий, конкретный. Без общих фраз.`;

        const { text, model } = await geminiGenerate({
            systemInstruction: adviceInstruction,
            userPayload: { kpis, role, email: email || null }
        });

        db.prepare(
            `INSERT INTO ai_insights (context_type, context_key, body, model, meta_json)
       VALUES ('advice', ?, ?, ?, ?)`
        ).run(key, text, model, JSON.stringify({ role, email }));

        res.json({ text, cached: false, model });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message || 'advice error' });
    }
});

apiRouter.get('/telegram/recent', (req, res) => {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 30));
    const rows = db
        .prepare(
            `SELECT id, chat_id, user_id, username, text, created_at, update_kind, chat_title
     FROM telegram_messages ORDER BY id DESC LIMIT ?`
        )
        .all(limit);
    res.json(rows);
});

apiRouter.get('/insights/recent', (req, res) => {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const rows = db
        .prepare(
            `SELECT id, context_type, context_key, substr(body,1,400) as preview, model, created_at
     FROM ai_insights ORDER BY id DESC LIMIT ?`
        )
        .all(limit);
    res.json(rows);
});

/** Отчёты, извлечённые из чатов (для дашборда). */
apiRouter.get('/kpis/live', (req, res) => {
    try {
        const project = (req.query.project || 'all').toString();
        const role = (req.query.role || 'ADMIN').toString();
        const buyer = (req.query.buyer || 'all').toString();
        const processor = (req.query.processor || 'all').toString();
        const period = (req.query.period || 'today').toString();
        const reportDate = (req.query.date || '').toString();
        const dateFrom = (req.query.date_from || '').toString();
        const dateTo = (req.query.date_to || '').toString();
        const filterCtx = {
            project,
            buyer,
            processor,
            period,
            reportDate,
            dateFrom,
            dateTo,
            projectName: project,
            periodLabel: dateFrom || dateTo ? `${dateFrom || '...'}..${dateTo || '...'}` : reportDate || period,
            buyerName: buyer,
            processorName: processor
        };
        const pack = buildMergedKpisForRole(role, filterCtx);
        res.json(pack);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message || 'kpis error' });
    }
});

apiRouter.get('/filters/processors', (req, res) => {
    try {
        const project = (req.query.project || 'all').toString();
        const rows = listLiveProcessors(project);
        res.json([{ value: 'all', label: 'Все обработчики' }, ...rows]);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message || 'processors filter error' });
    }
});

apiRouter.get('/filters/buyers', (req, res) => {
    try {
        const project = (req.query.project || 'all').toString();
        const rows = listLiveBuyers(project);
        res.json([{ value: 'all', label: 'Все баеры' }, ...rows]);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message || 'buyers filter error' });
    }
});

apiRouter.put('/kpis/overrides', express.json({ limit: '64kb' }), (req, res) => {
    try {
        const reportDate = (req.body?.report_date || '').toString().trim();
        const dashboardKey = (req.body?.dashboard_key || '').toString().trim();
        const processorKey = normalizeProcessorKey((req.body?.processor_key || 'all').toString());
        const key = (req.body?.key || '').toString().trim();
        const valueRaw = req.body?.value;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(reportDate)) {
            return res.status(400).json({ error: 'report_date должен быть YYYY-MM-DD' });
        }
        if (!dashboardKey) return res.status(400).json({ error: 'dashboard_key required' });
        if (!key) return res.status(400).json({ error: 'key required' });
        const value = Number(valueRaw);
        if (!Number.isFinite(value)) return res.status(400).json({ error: 'value must be number' });

        const row = db
            .prepare(
                `SELECT metrics_json FROM daily_kpi_overrides
                 WHERE report_date = ? AND dashboard_key = ? AND processor_key = ?`
            )
            .get(reportDate, dashboardKey, processorKey);
        let obj = {};
        if (row?.metrics_json) {
            try {
                obj = JSON.parse(row.metrics_json) || {};
            } catch {
                obj = {};
            }
        }
        obj[key] = value;
        db.prepare(
            `INSERT INTO daily_kpi_overrides (report_date, dashboard_key, processor_key, metrics_json, updated_at)
             VALUES (?, ?, ?, ?, datetime('now'))
             ON CONFLICT(report_date, dashboard_key, processor_key) DO UPDATE SET
               metrics_json = excluded.metrics_json,
               updated_at = datetime('now')`
        ).run(reportDate, dashboardKey, processorKey, JSON.stringify(obj));
        res.json({ ok: true, report_date: reportDate, dashboard_key: dashboardKey, processor_key: processorKey, key, value });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message || 'kpi override error' });
    }
});

apiRouter.get('/channels/bindings', (req, res) => {
    const rows = db.prepare(`SELECT chat_id, dashboard_key, label, updated_at FROM channel_project_map ORDER BY dashboard_key, chat_id`).all();
    res.json(rows);
});

/** Каналы/супергруппы: часто вводят только цифры без -100… */
function normalizeChannelBindingChatId(raw) {
    const s = String(raw ?? '').trim();
    if (/^\d{8,}$/.test(s)) return `-100${s}`;
    return s;
}

apiRouter.post('/channels/bindings', express.json({ limit: '32kb' }), (req, res) => {
    const chat_id = normalizeChannelBindingChatId(req.body?.chat_id != null ? String(req.body.chat_id).trim() : '');
    const dashboard_key = (req.body?.dashboard_key || '').toString().trim();
    const label = (req.body?.label || '').toString().trim() || null;
    if (!chat_id || !dashboard_key) {
        return res.status(400).json({ error: 'chat_id и dashboard_key обязательны' });
    }
    db.prepare(
        `INSERT INTO channel_project_map (chat_id, dashboard_key, label, updated_at)
     VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(chat_id) DO UPDATE SET
       dashboard_key = excluded.dashboard_key,
       label = excluded.label,
       updated_at = datetime('now')`
    ).run(chat_id, dashboard_key, label);
    res.json({ ok: true, chat_id, dashboard_key, label });
});

apiRouter.delete('/channels/bindings/:chatId', (req, res) => {
    const chatId = decodeURIComponent(req.params.chatId || '');
    const r = db.prepare(`DELETE FROM channel_project_map WHERE chat_id = ?`).run(chatId);
    res.json({ ok: true, removed: r.changes });
});

apiRouter.get('/reports/finance', (req, res) => {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 40));
    const rows = db
        .prepare(
            `SELECT
        e.id,
        e.report_type,
        e.project,
        e.geo,
        e.period_label,
        e.summary_one_line,
        e.metrics_json,
        e.full_json,
        e.created_at,
        e.message_id,
        m.username AS source_username,
        m.update_kind AS source_kind,
        m.chat_title AS chat_title,
        m.text AS source_text,
        substr(m.text, 1, 220) AS source_preview
      FROM fin_report_extracts e
      LEFT JOIN telegram_messages m ON m.id = e.message_id
      ORDER BY e.id DESC
      LIMIT ?`
        )
        .all(limit);
    res.json(rows);
});

apiRouter.put('/reports/finance/:id', express.json({ limit: '512kb' }), (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: 'invalid id' });
        const raw = req.body?.full_json;
        if (typeof raw !== 'string' || !raw.trim()) {
            return res.status(400).json({ error: 'full_json string required' });
        }
        let obj;
        try {
            obj = JSON.parse(raw);
        } catch {
            return res.status(400).json({ error: 'full_json must be valid JSON' });
        }

        const current = db.prepare(`SELECT id, message_id, chat_id FROM fin_report_extracts WHERE id = ?`).get(id);
        if (!current) return res.status(404).json({ error: 'report not found' });

        const metrics = obj.metrics;
        const metricsJson =
            metrics && typeof metrics === 'object' ? JSON.stringify(metrics) : metrics ? String(metrics) : null;
        const hasMetrics =
            metrics && typeof metrics === 'object' && Object.keys(metrics).some((k) => Number.isFinite(parseFloat(metrics[k])));
        let reportType = obj.report_type ?? obj.reportType ?? (hasMetrics ? 'ad_hoc' : 'noise');
        if (hasMetrics && (!reportType || reportType === 'noise')) reportType = 'ad_hoc';
        const project = obj.project ?? obj.project_name ?? null;
        const geo = obj.geo ?? obj.country ?? null;
        const periodLabel = obj.period?.label ?? obj.period_label ?? (typeof obj.period === 'string' ? obj.period : null);
        const summary = obj.summary_one_line ?? obj.summary ?? obj.summaryOneLine ?? null;

        db.prepare(
            `UPDATE fin_report_extracts
             SET report_type = ?, project = ?, geo = ?, period_label = ?, summary_one_line = ?, metrics_json = ?, full_json = ?, model = ?
             WHERE id = ?`
        ).run(
            reportType ? String(reportType).slice(0, 64) : null,
            project ? String(project).slice(0, 128) : null,
            geo ? String(geo).slice(0, 64) : null,
            periodLabel ? String(periodLabel).slice(0, 128) : null,
            summary ? String(summary).slice(0, 512) : null,
            metricsJson,
            JSON.stringify(obj).slice(0, 62000),
            'manual_edit_v1',
            id
        );

        if (current.message_id) {
            db.prepare(`INSERT INTO parsed_reports (message_id, structured_json, model) VALUES (?, ?, ?)`).run(
                current.message_id,
                JSON.stringify(obj).slice(0, 32000),
                'manual_edit_v1'
            );
        }

        res.json({ ok: true, id });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message || 'report update error' });
    }
});
