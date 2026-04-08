/** 2.0-flash на free tier часто даёт quota limit: 0; lite обычно доступен и с большим RPD. */
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';

const FALLBACK_MODELS = (process.env.GEMINI_FALLBACK_MODELS ||
    'gemini-2.5-flash-lite,gemini-2.5-flash,gemini-flash-latest')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

async function geminiGenerateOnce(model, key, combined) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: combined }] }],
            generationConfig: {
                temperature: 0.35,
                maxOutputTokens: 4096
            }
        })
    });

    if (!res.ok) {
        const t = await res.text();
        const err = new Error(`Gemini HTTP ${res.status}: ${t.slice(0, 500)}`);
        err.code = 'GEMINI_HTTP';
        err.status = res.status;
        throw err;
    }

    const data = await res.json();
    const text =
        data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ||
        data?.error?.message ||
        '';
    if (!text) {
        const err = new Error('Пустой ответ Gemini');
        err.code = 'GEMINI_EMPTY';
        throw err;
    }
    return { text, model };
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function geminiGenerate({ systemInstruction, userPayload }) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        const err = new Error('GEMINI_API_KEY не задан в .env');
        err.code = 'NO_KEY';
        throw err;
    }

    const combined = `${systemInstruction}\n\n--- ВХОДНЫЕ ДАННЫЕ (JSON) ---\n${typeof userPayload === 'string' ? userPayload : JSON.stringify(userPayload, null, 2)}`;

    const primary = process.env.GEMINI_MODEL || DEFAULT_MODEL;
    const chain = [primary, ...FALLBACK_MODELS.filter((m) => m !== primary)];

    let lastErr;
    for (const model of chain) {
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                return await geminiGenerateOnce(model, key, combined);
            } catch (e) {
                lastErr = e;
                const isRate = e.code === 'GEMINI_HTTP' && e.status === 429;
                const isUnavailable = e.code === 'GEMINI_HTTP' && e.status === 503;
                const canRetrySame = (isRate || isUnavailable) && attempt < 3;
                if (canRetrySame) {
                    const waitMs = attempt === 1 ? 1200 : 2800;
                    console.warn(`[gemini] ${e.status} на ${model}, retry #${attempt} через ${waitMs}ms`);
                    await sleep(waitMs);
                    continue;
                }
                const canTryNextModel =
                    (isRate || isUnavailable) &&
                    model !== chain[chain.length - 1];
                if (canTryNextModel) {
                    console.warn(`[gemini] ${e.status} на ${model}, пробую следующую модель…`);
                    break;
                }
                if (e.status === 429 || e.status === 503) {
                    e.message +=
                        ' | Подсказка: повторите запрос через 10–30 сек; при частых ошибках смените GEMINI_MODEL или включите биллинг.';
                }
                throw e;
            }
        }
    }
    throw lastErr;
}
