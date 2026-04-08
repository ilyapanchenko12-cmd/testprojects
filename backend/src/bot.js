import { Telegraf, Markup } from 'telegraf';
import { db, getPrompt } from './db.js';
import { geminiGenerate } from './ai.js';
import { persistFinReportExtract } from './reportExtract.js';
import { slugifyProjectLabel } from './kpis.js';
import { findBindingRowByChatCandidates } from './telegramChatId.js';

let botInstance = null;
const intakeSessions = new Map();

function sessionKeyFromCtx(ctx) {
    const chatId = ctx.chat?.id != null ? String(ctx.chat.id) : '';
    const userId = ctx.from?.id != null ? String(ctx.from.id) : '';
    return `${chatId}:${userId}`;
}

function getSession(ctx) {
    return intakeSessions.get(sessionKeyFromCtx(ctx)) || null;
}

function setSession(ctx, session) {
    intakeSessions.set(sessionKeyFromCtx(ctx), session);
}

function clearSession(ctx) {
    intakeSessions.delete(sessionKeyFromCtx(ctx));
}

/**
 * ID чата для БД и привязки.
 * Нативные посты канала: всегда chat.id канала (не опираемся на sender_chat).
 * Обсуждение: сообщения «от канала» дают sender_chat.type === 'channel'.
 */
function storageChatIdFromPost(post, updateKind) {
    if (updateKind === 'channel_post' || updateKind === 'edited_channel_post') {
        return post.chat?.id != null ? String(post.chat.id) : '';
    }
    const sc = post.sender_chat;
    if (sc && sc.type === 'channel' && sc.id != null) {
        return String(sc.id);
    }
    return post.chat?.id != null ? String(post.chat.id) : '';
}

function findBindingForPost(post, updateKind) {
    const primary = storageChatIdFromPost(post, updateKind);
    let row = primary ? findBindingRowByChatCandidates(db, primary) : null;
    const alt = post.chat?.id != null ? String(post.chat.id) : null;
    if (!row && alt && alt !== primary) {
        row = findBindingRowByChatCandidates(db, alt);
    }
    return { binding: row || null, storageChatId: primary || alt || '' };
}

async function processInboundPost(ctx, post, updateKind, opts = {}) {
    const text = post.text || post.caption || '';
    const { binding, storageChatId: chatId } = findBindingForPost(post, updateKind);
    const from = post.from;
    const senderChat = post.sender_chat;
    let username =
        (from?.username && '@' + from.username) ||
        from?.first_name ||
        senderChat?.title ||
        post.author_signature ||
        (updateKind === 'channel_post' ? 'channel' : '');
    const userId = from ? String(from.id) : senderChat ? String(senderChat.id) : '';

    let chatTitle = post.chat?.title || null;
    try {
        const chat = await ctx.telegram.getChat(post.chat.id);
        if (chat && 'title' in chat && chat.title) chatTitle = chat.title;
        else if (chat && 'username' in chat && chat.username) chatTitle = '@' + chat.username;
    } catch (e) {
        /* ignore */
    }

    console.log(
        `[bot] ${updateKind} chat=${chatId} tg_chat=${post.chat?.id} sender_chat=${senderChat?.id || '-'} len=${text.length} bind=${binding ? binding.dashboard_key : '—'}`
    );

    const msgStmt = db.prepare(`
        INSERT INTO telegram_messages (chat_id, user_id, username, text, raw_json, update_kind, chat_title)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
    const msgInfo = msgStmt.run(
        chatId,
        userId,
        username,
        text.slice(0, 16000),
        JSON.stringify(post).slice(0, 32000),
        updateKind,
        chatTitle
    );
    const mid = msgInfo.lastInsertRowid;

    const textForAi = text.trim();
    const isGroupChat = post.chat?.type === 'group' || post.chat?.type === 'supergroup';
    const minLen = updateKind === 'channel_post' || updateKind === 'edited_channel_post' || isGroupChat ? 1 : 3;
    if (textForAi.length >= minLen && process.env.GEMINI_API_KEY) {
        try {
            const main = getPrompt('main');
            const titleProjectGuess = slugifyProjectLabel(chatTitle || '');
            const roleHint = opts.roleHint || null;

            let bindingHint = '';
            if (binding) {
                if (isGroupChat) {
                    bindingHint = `Группа/чат привязан к проекту CRM, ключ "${binding.dashboard_key}". В JSON поле project укажи строго "${binding.dashboard_key}" (латинский ключ как в CRM). Метрики из текста занеси в metrics как числа.`;
                } else {
                    bindingHint = `Канал привязан к проекту CRM: ключ "${binding.dashboard_key}". В JSON поле project укажи "${binding.label || binding.dashboard_key}". Метрики из текста занеси в metrics как числа.`;
                }
            } else if (updateKind === 'channel_post') {
                bindingHint = 'Это пост из Telegram-канала. Извлеки отчётные цифры в metrics.';
            } else if (isGroupChat) {
                bindingHint = titleProjectGuess
                    ? `Сообщение из группы Telegram (привязка chat_id→проект в CRM пока не задана). Название чата: "${chatTitle || ''}". Если это отчёт — в project укажи ключ проекта CRM (peru1, peru2, argentina, mexico, chile, italy); по названию чата вероятен ключ "${titleProjectGuess}". Иначе добавь привязку в CRM — иначе дашборд не сопоставит строку.`
                    : `Сообщение из группы Telegram без привязки к проекту. Укажи в project один из ключей CRM (peru1, peru2, …) по смыслу текста или настрой привязку chat_id группы в CRM.`;
            }

            const parsePrompt = `${main.body}

СЕЙЧАС: одно входящее сообщение из Telegram (${updateKind === 'channel_post' ? 'пост канала' : isGroupChat ? 'группа/супергруппа' : 'чат'}).
${bindingHint}
${roleHint ? `Роль отправителя по выбору в боте: ${roleHint}. Учитывай это при извлечении метрик.` : ''}

Извлеки финансовый/операционный отчёт арбитража, если он есть.

Ответь ТОЛЬКО валидным JSON (без markdown, без комментариев), строго в форме:
{
  "report_type": "daily|weekly|ad_hoc|noise",
  "period": { "label": null, "date_from": null, "date_to": null },
  "author_hint": null,
  "project": null,
  "geo": null,
  "currency": null,
  "metrics": { },
  "lines": [],
  "summary_one_line": "",
  "raw_preserve": null
}

Правила: report_type \"noise\" если отчёта нет; metrics — числа из текста. Ключи: spend, revenue, fd, fdSum, при необходимости pdp, rd, chats, sub2dia, dia2fd, fd2rd.
Если в тексте отчёта автор указывает своё имя/ник обработчика — заполни author_hint этим именем (без выдумок).
Выручка revenue: если в сообщении явно названа выручка — возьми её; если нет, но есть fdSum и spend в одной валюте — вычисли revenue = fdSum − spend и добавь в metrics (спенд вычитается из суммы FD).
`;

            const { text: rawOut, model } = await geminiGenerate({
                systemInstruction: parsePrompt,
                userPayload: {
                    telegram_text: text,
                    author: username,
                    chat_title: chatTitle,
                    channel_binding: binding || null
                }
            });
            let structured = rawOut.trim();
            if (structured.startsWith('```')) {
                structured = structured.replace(/^```json?\s*/i, '').replace(/\s*```$/, '');
            }
            db.prepare(`INSERT INTO parsed_reports (message_id, structured_json, model) VALUES (?, ?, ?)`).run(
                mid,
                structured.slice(0, 32000),
                model
            );
            const extractId = persistFinReportExtract(mid, structured, model, {
                chatId,
                dashboardKeyFromBinding: binding ? binding.dashboard_key : null,
                roleHint: roleHint || null,
                sourceText: text
            });
            if (post.chat?.type === 'private') {
                let obj = null;
                try {
                    obj = JSON.parse(structured);
                } catch {
                    obj = null;
                }
                const metrics = obj?.metrics && typeof obj.metrics === 'object' ? obj.metrics : null;
                const hasMetrics =
                    metrics &&
                    Object.values(metrics).some((v) => {
                        if (v == null) return false;
                        if (typeof v === 'number' && Number.isFinite(v)) return true;
                        const n = parseFloat(String(v).replace(/\s/g, '').replace(',', '.'));
                        return Number.isFinite(n);
                    });
                const projectKey = binding?.dashboard_key || slugifyProjectLabel(obj?.project || obj?.project_name || obj?.geo || null);
                if (extractId && hasMetrics && projectKey) {
                    await ctx.reply(`Принято. Отчёт добавлен в дашборд проекта "${projectKey}".`);
                } else if (extractId && hasMetrics) {
                    await ctx.reply(
                        'Отчёт сохранён, но в дашборд проекта пока не сопоставлен: не определился проект. Добавьте в текст project/geo (например "Аргентина") или привяжите chat_id к проекту.'
                    );
                } else if (extractId) {
                    await ctx.reply('Сообщение получено, но отчётные метрики не найдены — в дашборд не добавлено.');
                }
            }
        } catch (e) {
            console.warn('[bot] parse skip:', e.message);
            if (post.chat?.type === 'private') {
                await ctx.reply(`Не смог разобрать отчёт: ${e.message || 'ошибка парсинга'}`);
            }
        }
    }
}

export function startTelegramBot() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
        console.warn('[bot] TELEGRAM_BOT_TOKEN не задан — бот не запущен.');
        return null;
    }

    const bot = new Telegraf(token);
    botInstance = bot;

    bot.start(async (ctx) => {
        try {
            setSession(ctx, { role: null });
            await ctx.reply(
                'Вас приветствует CRM D7 бот.\nВыбери роль: Баинг или Обработка. После этого просто отправь отчёт одним сообщением.',
                Markup.keyboard([['Баинг', 'Обработка']]).resize()
            );
        } catch (e) {
            console.error('[bot] start handler', e);
        }
    });

    bot.on('message', async (ctx, next) => {
        try {
            const msg = ctx.message;
            if (!msg) return next();
            const txt = (msg.text || msg.caption || '').trim();
            const isPrivate = ctx.chat?.type === 'private';
            if (isPrivate && (txt === 'Баинг' || txt === 'Обработка')) {
                const role = txt === 'Баинг' ? 'buying' : 'processing';
                setSession(ctx, { role });
                await ctx.reply(`Роль сохранена: ${txt}. Теперь просто отправляй отчёты обычным текстом.`);
                return next();
            }
            const roleHint = isPrivate ? getSession(ctx)?.role || null : null;
            await processInboundPost(ctx, msg, 'message', { roleHint });
        } catch (e) {
            console.error('[bot] message handler', e);
        }
        return next();
    });

    bot.on('channel_post', async (ctx, next) => {
        try {
            const post = ctx.channelPost;
            if (!post) return next();
            await processInboundPost(ctx, post, 'channel_post');
        } catch (e) {
            console.error('[bot] channel_post handler', e);
        }
        return next();
    });

    bot.on('edited_channel_post', async (ctx, next) => {
        try {
            const post = ctx.editedChannelPost;
            if (!post) return next();
            await processInboundPost(ctx, post, 'edited_channel_post');
        } catch (e) {
            console.error('[bot] edited_channel_post', e);
        }
        return next();
    });

    bot.on('edited_message', async (ctx, next) => {
        try {
            const msg = ctx.editedMessage;
            if (!msg) return next();
            await processInboundPost(ctx, msg, 'edited_message');
        } catch (e) {
            console.error('[bot] edited_message', e);
        }
        return next();
    });

    const allowedUpdates = ['message', 'edited_message', 'channel_post', 'edited_channel_post'];

    bot
        .launch({ allowedUpdates })
        .then(async () => {
            console.log(
                '[bot] Polling: message, channel_post, edited_*. Канал: бот = админ. Обсуждение: привязка по id канала или группы.'
            );
            try {
                const wh = await bot.telegram.getWebhookInfo();
                if (wh?.url) {
                    console.warn(
                        '[bot] У бота всё ещё настроен webhook URL — long polling может не получать апдейты. Сбросьте: BotFather /deleteWebhook или API deleteWebhook.'
                    );
                }
            } catch (e) {
                console.warn('[bot] getWebhookInfo:', e.message);
            }
        })
        .catch((e) => console.error('[bot] launch failed:', e));
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));

    return bot;
}
