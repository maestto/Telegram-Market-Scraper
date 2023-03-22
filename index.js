const {Telegraf} = require('telegraf');
require('dotenv').config()

const {scrap, parse} = require("./commands");
const {parsing} = require("./commands/parsing");

const bot = new Telegraf(process.env.TELEGRAF_KEY);

let searchParams = {
    keywords: [],
    priceRange: [],
}

bot.command('start', ctx => {scrap(ctx).catch(console.error)});
bot.on("callback_query", async function onCallbackQuery(ctx) {{parse(ctx).catch(console.error)}});

bot.hears(/([0-9]+)-([0-9]+)/, (ctx) => {
    if(searchParams.keywords.length == 0) return ctx.reply('Укажите ключевые слова');
    const priceRange = ctx.match.slice(1);
    ctx.reply(`Вы ищете товары в ценовом диапазоне от ${priceRange[0]} до ${priceRange[1]}.`);
    searchParams.priceRange.push(priceRange);
    parsing(ctx, searchParams)
    searchParams.keywords = []
    searchParams.priceRange = []
});
bot.hears(/(.+)/, (ctx) => {
    const keywords = ctx.match[1]; //text.split('\n')
    ctx.reply(`Вы ищете ${keywords}. Какой ценовой диапазон вас интересует?`);
    searchParams.keywords.push(keywords);
});

bot.launch().catch(console.error);

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));