import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { grantPremium, now, resource } from "../study-data.js";

const composer = new Composer<Ctx>();
const YEAR_MS = 365 * 24 * 60 * 60 * 1000;
composer.callbackQuery(/^download:confirm:(.+)$/, async (ctx) => { await ctx.answerCallbackQuery(); const item = await resource(ctx, ctx.match[1]); const chatId = ctx.chat?.id; if (!item) { await ctx.reply("That resource isn’t available anymore."); return; } if (chatId === undefined) { await ctx.reply("Open this resource from a chat to continue."); return; } try { await ctx.api.sendInvoice(chatId, "StudyCrafter Premium", "One year of premium downloads", `premium:${item.id}`, "XTR", [{ label: "Premium for a year", amount: 250 }]); } catch { await ctx.reply("Payments aren’t available right now. Try again later."); } });
composer.on("pre_checkout_query", async (ctx) => { const payload = ctx.preCheckoutQuery.invoice_payload; if (!payload.startsWith("premium:")) { await ctx.answerPreCheckoutQuery(false, { error_message: "That checkout is no longer available." }); return; } await ctx.answerPreCheckoutQuery(true); });
composer.on("message:successful_payment", async (ctx) => { const payment = ctx.message.successful_payment; if (!payment.invoice_payload.startsWith("premium:")) return; await grantPremium(ctx, now() + YEAR_MS); await ctx.reply("Premium is unlocked for a year. Your downloads are ready!"); });
export default composer;
