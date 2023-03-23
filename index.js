const {Telegraf} = require('telegraf');
require('dotenv').config()

const {scrap, parse, textHandler} = require("./commands");

const bot = new Telegraf(process.env.TELEGRAF_KEY);

bot.command('start', ctx => {scrap(ctx).catch(console.error)});
bot.on("callback_query", async function onCallbackQuery(ctx) {{parse(ctx).catch(console.error)}});
bot.on("message", ctx => {textHandler(ctx).catch(console.error)});

bot.launch().catch(console.error);

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));