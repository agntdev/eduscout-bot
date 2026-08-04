import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";
import { history } from "../study-data.js";
registerMainMenuItem({ label: "🕘 History", data: "history:list", order: 40 });
const composer = new Composer<Ctx>();
composer.callbackQuery("history:list", async (ctx) => { await ctx.answerCallbackQuery(); const seen = await history(ctx); if (!seen.length) { await ctx.editMessageText("No study history yet — open a resource and it’ll appear here.", { reply_markup: inlineKeyboard([[inlineButton("Browse resources", "home:main")]]) }); return; } await ctx.editMessageText("Pick up where you left off.", { reply_markup: inlineKeyboard([...seen.map((item) => [inlineButton(`${item.title} · ready to continue`, `resource:${item.id}`)]),[inlineButton("Back to menu", "menu:main")]]) }); });
export default composer;
