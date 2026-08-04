import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { hasPremium, resource, toggleBookmark, viewed } from "../study-data.js";

const composer = new Composer<Ctx>();
function size(bytes: number): string { return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.ceil(bytes / 1024))} KB`; }
composer.callbackQuery(/^resource:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery(); const item = await resource(ctx, ctx.match[1]);
  if (!item) { await ctx.editMessageText("That resource isn’t available anymore. Browse to find another one.", { reply_markup: inlineKeyboard([[inlineButton("Browse", "home:main")]]) }); return; }
  await viewed(ctx, item.id);
  const access = item.premium_flag ? "Premium" : "Free";
  await ctx.editMessageText(`${item.title}\n${item.subject} • ${item.class_name}\n${item.format.toUpperCase()} • ${size(item.size)} • ${access}`, { reply_markup: inlineKeyboard([[inlineButton("Save bookmark", `bookmark:${item.id}`), inlineButton("Download", `download:${item.id}`)],[inlineButton("Back to browse", "home:main")]]) });
});
composer.callbackQuery(/^bookmark:(.+)$/, async (ctx) => { await ctx.answerCallbackQuery(); const result = await toggleBookmark(ctx, ctx.match[1]); await ctx.reply(result === "saved" ? "Saved to your bookmarks." : result === "removed" ? "Removed from your bookmarks." : "Your bookmarks aren’t ready yet. Try again in a moment."); });
composer.callbackQuery(/^download:(.+)$/, async (ctx) => { await ctx.answerCallbackQuery(); const item = await resource(ctx, ctx.match[1]); if (!item) { await ctx.reply("That resource isn’t available anymore."); return; } if (item.premium_flag && !(await hasPremium(ctx))) { await ctx.reply("This is a premium resource. Unlock Premium to download it.", { reply_markup: inlineKeyboard([[inlineButton("Unlock Premium", `download:confirm:${item.id}`)],[inlineButton("Back to resource", `resource:${item.id}`)]]) }); return; } if (item.size > 20 * 1024 * 1024) { await ctx.reply("This file is large. Confirm before the download starts.", { reply_markup: inlineKeyboard([[inlineButton("Confirm download", `download:large:${item.id}`)],[inlineButton("Back", `resource:${item.id}`)]]) }); return; } await ctx.replyWithDocument(item.file_id, { caption: `Here’s ${item.title}. Happy studying!` }); });
composer.callbackQuery(/^download:large:(.+)$/, async (ctx) => { await ctx.answerCallbackQuery(); const item = await resource(ctx, ctx.match[1]); if (!item) { await ctx.reply("That resource isn’t available anymore."); return; } await ctx.replyWithDocument(item.file_id, { caption: `Here’s ${item.title}. Happy studying!` }); });
export default composer;
