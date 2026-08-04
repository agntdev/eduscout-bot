import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";
import { resources } from "../study-data.js";

registerMainMenuItem({ label: "📚 Browse", data: "home:main", order: 10 });
const composer = new Composer<Ctx>();
const categories = inlineKeyboard([[inlineButton("Pick a class", "browse:class"), inlineButton("Pick a subject", "browse:subject")],[inlineButton("Search resources", "search:init")],[inlineButton("Back to menu", "menu:main")]]);
async function list(ctx: Ctx, where = "", values: unknown[] = []) { const found = await resources(ctx, where, values); if (!found.length) { await ctx.editMessageText("No resources match that yet — try another subject or ask your educator to add one.", { reply_markup: categories }); return; } await ctx.editMessageText("Choose a resource to start studying.", { reply_markup: inlineKeyboard([...found.slice(0, 8).map((r) => [inlineButton(r.title, `resource:${r.id}`)]), [inlineButton("Back to categories", "home:main")]]) }); }
composer.callbackQuery("home:main", async (ctx) => { await ctx.answerCallbackQuery(); await ctx.editMessageText("Find something useful for today’s study session.", { reply_markup: categories }); });
composer.callbackQuery("browse:class", async (ctx) => { await ctx.answerCallbackQuery(); await ctx.editMessageText("Choose your class level.", { reply_markup: inlineKeyboard([[inlineButton("Primary", "class:Primary")],[inlineButton("Middle school", "class:Middle")],[inlineButton("High school", "class:High")],[inlineButton("Back", "home:main")]]) }); });
composer.callbackQuery("browse:subject", async (ctx) => { await ctx.answerCallbackQuery(); await ctx.editMessageText("Choose a subject.", { reply_markup: inlineKeyboard([[inlineButton("Math", "subject:Math")],[inlineButton("Science", "subject:Science")],[inlineButton("Languages", "subject:Languages")],[inlineButton("Back", "home:main")]]) }); });
composer.callbackQuery(/^class:(Primary|Middle|High)$/, async (ctx) => { await ctx.answerCallbackQuery(); await list(ctx, "WHERE class_name = ?", [ctx.match[1]]); });
composer.callbackQuery(/^subject:(Math|Science|Languages)$/, async (ctx) => { await ctx.answerCallbackQuery(); await list(ctx, "WHERE subject = ?", [ctx.match[1]]); });
export default composer;
