/**
 * Варианты одного и того же Telegram chat_id для SQLite (пользователь мог ввести без -100).
 */
export function chatIdBindingCandidates(raw) {
    const s = String(raw == null ? '' : raw).trim();
    if (!s) return [];
    const out = new Set([s]);
    const body = s.replace(/^-/, '');
    if (/^\d+$/.test(body)) {
        out.add(body);
        out.add(`-${body}`);
        out.add(`-100${body}`);
    }
    return [...out];
}

export function findBindingRowByChatCandidates(db, chatIdStr) {
    const candidates = chatIdBindingCandidates(chatIdStr);
    const stmt = db.prepare(`SELECT dashboard_key, label FROM channel_project_map WHERE chat_id = ?`);
    for (const cid of candidates) {
        const row = stmt.get(cid);
        if (row) return row;
    }
    return null;
}
