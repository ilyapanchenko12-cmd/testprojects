import { geminiGenerate } from './ai.js';
import { db } from './db.js';

const DEFAULT_FX_TO_USD = {
    usd: 1,
    usdt: 1,
    eur: 1.08,
    gbp: 1.27,
    chf: 1.11,
    cad: 0.74,
    aud: 0.66,
    jpy: 0.0067,
    cny: 0.14,
    aed: 0.272,
    rub: 0.011,
    uah: 0.024,
    kzt: 0.0021,
    try: 0.031,
    ars: 0.007175,
    brl: 0.2,
    clp: 0.001,
    cop: 0.00025,
    pen: 0.27,
    sol: 0.27,
    mxn: 0.059
};

const EDITABLE_CODES = ['mxn', 'sol', 'ars', 'clp', 'eur'];

const CURRENCY_ALIASES = {
    '$': 'usd',
    доллар: 'usd',
    доллары: 'usd',
    евро: 'eur',
    фунт: 'gbp',
    франк: 'chf',
    руб: 'rub',
    рубль: 'rub',
    грн: 'uah',
    тенге: 'kzt',
    лира: 'try',
    дирхам: 'aed',
    песо: 'ars',
    ar: 'ars',
    ars$: 'ars',
    real: 'brl',
    sol: 'sol'
};

let fxToUsd = { ...DEFAULT_FX_TO_USD };
let manualFxToUsd = {};
let updaterStarted = false;

export function normalizeCurrencyCode(raw) {
    const s = String(raw || '').trim().toLowerCase().replace(/[^a-z$а-я]/gi, '');
    if (!s) return '';
    return CURRENCY_ALIASES[s] || s;
}

export function detectCurrencyCode({ currency, text, geo } = {}) {
    const c = normalizeCurrencyCode(currency);
    if (c) return c;
    const s = String(text || '').toLowerCase();
    if (/\busdt?\b/.test(s) || /\$\s*\d|\d\s*\$/.test(s)) return 'usd';
    const tokens = s.match(/\b([a-z]{2,4}|[а-я]{3,12})\b/gi) || [];
    for (const token of tokens) {
        const code = normalizeCurrencyCode(token);
        if (code && (fxToUsd[code] || DEFAULT_FX_TO_USD[code])) return code;
    }
    const g = String(geo || '').toLowerCase();
    if (/arg|аргентин/.test(g)) return 'ars';
    return 'usd';
}

export function getFxToUsd(code) {
    const c = normalizeCurrencyCode(code);
    if (manualFxToUsd[c]) return manualFxToUsd[c];
    return fxToUsd[c] || DEFAULT_FX_TO_USD[c] || 1;
}

function loadManualFxFromDb() {
    const rows = db.prepare(`SELECT code, usd_rate FROM manual_fx_rates`).all();
    const next = {};
    for (const r of rows) {
        const code = normalizeCurrencyCode(r.code);
        const n = Number(r.usd_rate);
        if (!code || !Number.isFinite(n) || n <= 0) continue;
        next[code] = n;
    }
    manualFxToUsd = next;
}

export function listEditableFxRates() {
    return EDITABLE_CODES.map((code) => ({
        code: code.toUpperCase(),
        usd_rate: manualFxToUsd[code] || fxToUsd[code] || DEFAULT_FX_TO_USD[code] || 1,
        source: manualFxToUsd[code] ? 'manual' : fxToUsd[code] ? 'ai' : 'default'
    }));
}

export function setManualFxRate(codeRaw, usdRateRaw) {
    const code = normalizeCurrencyCode(codeRaw);
    const usdRate = Number(usdRateRaw);
    if (!EDITABLE_CODES.includes(code)) throw new Error('unsupported code');
    if (!Number.isFinite(usdRate) || usdRate <= 0) throw new Error('invalid usd_rate');
    db.prepare(
        `INSERT INTO manual_fx_rates (code, usd_rate, updated_at)
         VALUES (?, ?, datetime('now'))
         ON CONFLICT(code) DO UPDATE SET usd_rate = excluded.usd_rate, updated_at = datetime('now')`
    ).run(code, usdRate);
    loadManualFxFromDb();
    return { code: code.toUpperCase(), usd_rate: usdRate };
}

async function refreshFxFromGemini() {
    if (!process.env.GEMINI_API_KEY) return;
    const codes = Object.keys(DEFAULT_FX_TO_USD).filter((x) => x !== 'usd' && x !== 'usdt');
    const prompt = `Верни ТОЛЬКО JSON-объект с курсами валют к USD на текущий момент.
Формат: {"EUR":1.08,"ARS":0.0012}
Только эти коды: ${codes.join(', ')}.
Значения: сколько USD за 1 единицу валюты.
Без markdown.`;
    const { text } = await geminiGenerate({ systemInstruction: prompt, userPayload: { now: new Date().toISOString() } });
    const raw = text.trim().replace(/^```json\s*/i, '').replace(/^```/, '').replace(/```$/, '').trim();
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== 'object') return;
    const next = { ...fxToUsd };
    for (const [k, v] of Object.entries(obj)) {
        const code = normalizeCurrencyCode(k);
        const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
        if (!code || !Number.isFinite(n) || n <= 0) continue;
        next[code] = n;
    }
    fxToUsd = next;
    loadManualFxFromDb();
    console.log('[fx] rates refreshed via Gemini');
}

export function startFxUpdater() {
    if (updaterStarted) return;
    updaterStarted = true;
    loadManualFxFromDb();
    refreshFxFromGemini().catch((e) => console.warn('[fx] refresh failed:', e.message));
    setInterval(() => {
        refreshFxFromGemini().catch((e) => console.warn('[fx] refresh failed:', e.message));
    }, 6 * 60 * 60 * 1000);
}

