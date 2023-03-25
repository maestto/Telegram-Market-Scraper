const {parsing} = require("./parsing");

const editMessage = async (ctx, text) => {await ctx.telegram.editMessageText(ctx.update.callback_query.message.chat.id, ctx.update.callback_query.message.message_id, null, text)}

let parsingParameters = [];

exports.scrap = async (ctx) => {
    ctx.reply('Выберите сайт для парсинга', {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: 'Ebay.es', callback_data: 'Ebay.es' },
                    { text: 'Leboncoin', callback_data: 'Leboncoin' },
                ],
                [
                    { text: 'Отмена', callback_data: 'Отмена' }
                ],
            ],
        },
    });
};

exports.parse = async (ctx) => {
    switch (ctx.update.callback_query.data) {
        case 'Отмена':
            await editMessage(ctx, 'Отменено');
            return;
        case 'Ebay.es':
            await editMessage(ctx, 'Укажите ключевые слова. Для каждого нового запроса переходите на следующую строчку, например:\n\niphone 12\niphone 13');
            parsingParameters[ctx.update.callback_query.from.username] = {site: ctx.update.callback_query.data};
            break;
        case 'Leboncoin':
            await editMessage(ctx, 'Не работает');
            return;
        default:
            await editMessage(ctx, 'Неизвестный сайт');
            return;
    }
};

exports.textHandler = async (ctx) => {
    if(!parsingParameters && !parsingParameters[ctx.update.message.from.username]) return;
    switch (true) {
        case (/([0-9]+)-([0-9]+)/.test(ctx.update.message.text)):
            if(!parsingParameters[ctx.update.message.from.username].keywords) ctx.reply('Сначала, укажите ключевые слова');
            parsingParameters[ctx.update.message.from.username].priceRange = ctx.update.message.text.split('-');
            ctx.reply(`Ключевые слова: [${parsingParameters[ctx.update.message.from.username].keywords}]\nЦеновой диапозон: ${parsingParameters[ctx.update.message.from.username].priceRange[0]}-${parsingParameters[ctx.update.message.from.username].priceRange[1]}.`);
            await parsing(ctx, parsingParameters[ctx.update.message.from.username]);
            delete parsingParameters[ctx.update.message.from.username];
            return;
        case (/(.+)/.test(ctx.update.message.text)):
            parsingParameters[ctx.update.message.from.username].keywords = ctx.update.message.text.split('\n');
            ctx.reply(`Ключевые слова: [${parsingParameters[ctx.update.message.from.username].keywords}]\nКакой ценовой диапазон вас интересует?`);
            return;
    }
};