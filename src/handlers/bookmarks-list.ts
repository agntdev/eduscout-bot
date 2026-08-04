import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";
import { bookmarks } from "../study-data.js";
registerMainMenuItem({ label: "🔖 Bookmarks", data: "bookmarks:list", order: 30 });
const composer = new Composer<Ctx>();
composer.callbackQuery("bookmarks:list", async (ctx) => { await ctx.answerCallbackQuery(); const saved = await bookmarks(ctx); if (!saved.length) { await ctx.editMessageText("No bookmarks yet — save a resource to keep it handy across your devices.", { reply_markup: inlineKeyboard([[inlineButton("Browse resources", "home:main")]]) }); return; } await ctx.editMessageText("Your saved resources are synced and ready.", { reply_markup: inlineKeyboard([...saved.map((item) => [inlineButton(item.title, `resource:${item.id}`)]),[inlineButton("Back to menu", "menu:main")]]) }); });
export default composer;
