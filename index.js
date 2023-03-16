const {Telegraf} = require('telegraf');
require('dotenv').config()

const {start, scrap} = require("./commands");

const bot = new Telegraf(process.env.TELEGRAF_KEY);

bot.command('start', ctx => {start(ctx).catch(console.error)});
bot.command('scrap', ctx => {scrap(ctx).catch(console.error)});

bot.launch().catch(console.error);

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));