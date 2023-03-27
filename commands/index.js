const {parsing} = require("./parsing");

const editMessage = async (ctx, text) => {await ctx.telegram.editMessageText(ctx.update.callback_query.message.chat.id, ctx.update.callback_query.message.message_id, null, text)}

let parsingParameters = [];

exports.scrap = async (ctx) => {
    ctx.reply('Выберите сайт для парсинга', {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: 'EBAY.ES', callback_data: 'EBAY.ES' },
                    { text: 'MARKTPLAATS.NL', callback_data: 'MARKTPLAATS.NL' },
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
        case 'EBAY.ES':
            await editMessage(ctx, 'Укажите ключевые слова. Для каждого нового запроса переходите на следующую строчку, например:\n\niphone 12\niphone 13');
            parsingParameters[ctx.update.callback_query.from.username] = {site: ctx.update.callback_query.data};
            break;
        case 'MARKTPLAATS.NL':
            await editMessage(ctx, 'Не');
            return;
        default:
            await editMessage(ctx, 'Неизвестный сайт');
            return;
    }
};

exports.textHandler = async (ctx) => {
    if(!parsingParameters && !parsingParameters[ctx.update.message.from.username]) return;
    const text = ctx.update.message.text;
    switch (true) {
        case (/([0-9]+)-([0-9]+)/.test(ctx.update.message.text)):
            if(!parsingParameters[ctx.update.message.from.username].keywords) return ctx.reply('Это похоже на указание параметра диапазона, сначала укажите ключевые слова! Для каждого нового запроса переходите на следующую строчку, например:\n\niphone 12\niphone 13');
            const ranges = text.split('-');
            switch (undefined) {
                case parsingParameters[ctx.update.message.from.username].priceRange:
                    parsingParameters[ctx.update.message.from.username].priceRange = ranges;
                    ctx.reply(`Ценовой диапазон: [${parsingParameters[ctx.update.message.from.username].priceRange}]\nУкажите диапазон отзывов. Например, 0-100`);
                    return;
                case parsingParameters[ctx.update.message.from.username].reviewsRange:
                    parsingParameters[ctx.update.message.from.username].reviewsRange = ranges;
                    ctx.reply(`Диапазон отзывов: [${parsingParameters[ctx.update.message.from.username].reviewsRange}]\nУкажите диапазон количеству проданных товаров. Например, 0-100`);
                    return;
                case parsingParameters[ctx.update.message.from.username].salesRange:
                    parsingParameters[ctx.update.message.from.username].salesRange = ranges;
                    ctx.reply(JSON.stringify(parsingParameters[ctx.update.message.from.username]));
                    await parsing(ctx, parsingParameters[ctx.update.message.from.username]);
                    delete parsingParameters[ctx.update.message.from.username];
                    return;
            }
            return;
        case (/(.+)/.test(ctx.update.message.text)):
            parsingParameters[ctx.update.message.from.username].keywords = ctx.update.message.text.split('\n');
            ctx.reply(`Ключевые слова: [${parsingParameters[ctx.update.message.from.username].keywords}]\nКакой ценовой диапазон вас интересует?`);
            return;
    }
};