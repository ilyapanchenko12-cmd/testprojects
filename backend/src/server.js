import 'dotenv/config';
import path from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import './db.js';
import { runMigrations } from './migrate.js';
import { apiRouter } from './routes.js';
import { startTelegramBot } from './bot.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Корень проекта, где лежит simple_working.html (рядом с backend/).
 * Учитываем разный cwd при запуске node.
 */
function resolveUiStaticRoot() {
    const dirs = [
        path.resolve(__dirname, '..', '..'),
        path.resolve(__dirname, '..'),
        process.cwd(),
        path.resolve(process.cwd(), '..')
    ];
    for (const dir of dirs) {
        if (existsSync(path.join(dir, 'simple_working.html'))) {
            return dir;
        }
    }
    return path.resolve(__dirname, '..', '..');
}

const uiStaticRoot = resolveUiStaticRoot();
if (!existsSync(path.join(uiStaticRoot, 'simple_working.html'))) {
    console.warn(
        '[crm] simple_working.html не найден. Ожидался файл в:',
        path.join(uiStaticRoot, 'simple_working.html')
    );
} else {
    console.log('[crm] интерфейс:', path.join(uiStaticRoot, 'simple_working.html'));
}

runMigrations();

const app = express();
const port = parseInt(process.env.PORT || '3847', 10);

const originsList = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const corsStrict = process.env.CORS_STRICT === '1';

function allowOrigin(origin) {
    if (!origin) return true;
    if (originsList.length === 0) return true;
    if (originsList.includes(origin)) return true;
    if (!corsStrict && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) return true;
    return false;
}

app.use(
    cors({
        origin(origin, callback) {
            if (allowOrigin(origin)) {
                callback(null, origin || true);
            } else {
                callback(null, false);
            }
        }
    })
);
app.use(express.json({ limit: '512kb' }));

app.use('/api', apiRouter);

/** Одна папка — и /, и /simple_working.html отдают CRM */
app.use(
    express.static(uiStaticRoot, {
        index: 'simple_working.html',
        maxAge: 0,
        dotfiles: 'ignore'
    })
);

app.get('/simple_working', (_req, res) => {
    res.redirect(302, '/simple_working.html');
});

app.listen(port, '0.0.0.0', () => {
    console.log(
        `[api] http://127.0.0.1:${port}  CRM: / или /simple_working.html  health: /api/health`
    );
    startTelegramBot();
});
