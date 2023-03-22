const {parsing} = require("./parsing");

const editMessage = async (ctx, text) => {await ctx.telegram.editMessageText(ctx.update.callback_query.message.chat.id, ctx.update.callback_query.message.message_id, null, text)}

let HandlerMode = ''

// encodeURI()

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
            editMessage(ctx, 'Отменено');
            return;
        case 'Ebay.es':
            editMessage(ctx, 'Введите ключевые слова для поиска. Для каждого нового запроса, переходите на следующую строчку, например:\n\niphone 12\niphone 13');
            break;
        case 'Leboncoin':
            editMessage(ctx, 'Не работает');
            return;
        default:
            editMessage(ctx, 'Неизвестный сайт');
            return;
    };

    /* 
        data: {
            keywords: []
            priceRange: {0, 1}
        }
    */


    //console.log(`parsing with data: ${data}`)
    //parsing(ctx);
};