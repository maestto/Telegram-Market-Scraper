const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

const {ebay} = require("../constants");

function processString(inputString) {
    const regex = /([\d,\.]+)\s*mil/i; // регулярное выражение для поиска числа с припиской "mil"
    const match = inputString.match(regex); // ищем совпадения в строке
    if (match) { // если найдено совпадение
        const num = parseFloat(match[1].replace(/,/g, '')) * 1000; // извлекаем число, заменяем запятые на точки и умножаем на 1000
        inputString = inputString.replace(match[0], num); // заменяем исходное значение числа на умноженное значение
    }
    return inputString; // возвращаем обработанную строку
}

function extractNumber(inputString) {
    const regex = /[\d,\.]+/; // регулярное выражение для поиска числа в строке
    const match = inputString.match(regex); // ищем совпадения в строке
    if (match) { // если найдено совпадение
        const num = parseFloat(match[0].replace(/\./g, '')); // извлекаем число, заменяем запятые на точки
        return num;
    }
    return null; // если число не найдено, возвращаем null
}

exports.parsing = async (ctx, data) => {
    let browser = await puppeteer.launch({
        headless: false,
        slowMo: 100,
        devtools: true
    });

    let searchPage = await browser.newPage()
    await searchPage.setViewport({
        width: 1400,
        height: 900
    });

    let productPage = await browser.newPage()
    await productPage.setViewport({
        width: 1400,
        height: 900
    });

    try {
        for (const keyword of data.keywords) {
            let nextPageButtonSelectorEnabled = true;
            let pageNumber = 1;
            let productsList = [];
            let link = `https://www.ebay.es/sch/i.html?_from=R40&_nkw=${encodeURIComponent(keyword)}&_sacat=9355&LH_TitleDesc=0&_udlo=${data.priceRange[0]}&_udhi=${data.priceRange[1]}&_pgn=`;

            while(nextPageButtonSelectorEnabled) {
                await searchPage.goto(`${link}${pageNumber}`, {
                    networkIdleTimeout: 5000,
                    waitUntil: 'networkidle0',
                    timeout: 3000000
                });
                await searchPage.waitForSelector(ebay.searchResultsCountSelector)

                const $ = cheerio.load(await searchPage.content());

                const getResultsNum = extractNumber($(ebay.searchResultsCountSelector).find('span').slice(0, 1).text())
                const resultMore60 = getResultsNum > 60

                nextPageButtonSelectorEnabled = resultMore60;
                if(nextPageButtonSelectorEnabled) {
                    await searchPage.waitForSelector(ebay.nextPageButtonSelector);
                    if($(ebay.nextPageButtonSelector).attr('aria-disabled')) nextPageButtonSelectorEnabled = false;
                }

                console.log(pageNumber);

                $(ebay.productsListSelector).find(ebay.productInfoSelector).slice(0, resultMore60 ? 60 : getResultsNum).each((_, productSection) => {
                    productsList.push({
                        title: $(productSection).find(ebay.productInfo.title).text(),
                        link: $(productSection).find(ebay.productInfo.link).attr('href'),
                        price: $(productSection).find(ebay.productInfo.price).text(),
                        image: $(productSection).find(ebay.productInfo.image).find('img').attr('src'),
                    });
                });

                for (let product of productsList) {
                    await productPage.goto(product.link, {
                        networkIdleTimeout: 5000,
                        waitUntil: "networkidle0",
                        timeout: 3000000
                    });
                    await productPage.waitForSelector(ebay.sellerInfo.sellerSection);
                    const $$ = cheerio.load(await productPage.content());

                    product.sellerURL = $$(ebay.sellerInfo.sellerSection).find('li.ux-seller-section__item').find('a').slice(0, 1).attr('href');
                    product.reviews = parseInt($$(ebay.sellerInfo.sellerSection).find('li.ux-seller-section__item').find('a').slice(1, 2).find('span').text());
                    product.positiveReviews = $$(ebay.sellerInfo.sellerSection).find('li.ux-seller-section__item').slice(1, 2).find('span.ux-textspans').text().slice(0, $$('ul.ux-seller-section__content').find('li.ux-seller-section__item').slice(1, 2).find('span.ux-textspans').text().search('%') + 1);
                    product.location = $$('div.ux-layout-section__row').find('div.col-9').find('span.ux-textspans--SECONDARY').text().slice($$('div.ux-layout-section__row').find('div.col-9').find('span.ux-textspans--SECONDARY').text().search(': ') + 2);
                    product.sellerSales = $$('div.d-stores-info-categories__container__info__section').find('div.d-stores-info-categories__container__info__section__item').slice(1, 2).find('span.ux-textspans--BOLD').text()
                    if(product.sellerSales === '') product.sellerSales = 'н/д';
                    else product.sellerSales = processString(product.sellerSales);

                    if(product.reviews >= data.reviewsRange[0] && product.reviews <= data.reviewsRange[1]
                        && product.sellerSales === 'н/д' || product.sellerSales >= data.salesRange[0] && product.sellerSales <= data.salesRange[0])
                    await ctx.telegram.sendPhoto(ctx.chat.id, product.image, { parse_mode: 'HTML', caption:
                            `🗂 <code>${product.title}</code>\n💵 <code>${product.price}</code>\n📍 <code>${product.location}</code>\n🔄 <code>${product.sellerSales}</code>\n💬 <code>${product.reviews} отзывов (${product.positiveReviews} положительных)</code>\n\n<a href='${product.link}'>🔗 Ссылка на товар</a>\n<a href='${product.sellerURL}'>🔗 Ссылка на продавца</a>`
                    });
                }

                pageNumber++;
                console.log(productsList.flat());
            }
        }
        await browser.close();
    } catch(e) {
        console.log(e);
        await browser.close();
    }
}