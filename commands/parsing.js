const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

const {ebay} = require("../constants");

exports.parsing = async (ctx, data) => {
    let browser = await puppeteer.launch({
        headless: false,
        slowMo: 100,
        devtools: true
    });

    let page1 = await browser.newPage()
    await page1.setViewport({
        width: 1400,
        height: 900
    });

    let page2 = await browser.newPage()
    await page2.setViewport({
        width: 1400,
        height: 900
    });

    try {
        for (const elem of data.keywords) {
            let nextPageButtonSelectorEnabled = true;
            let pageNumber = 1;
            let result = [];
            let link = `https://www.ebay.es/sch/i.html?_from=R40&_nkw=${encodeURIComponent(elem)}&_sacat=9355&LH_TitleDesc=0&_udlo=${data.priceRange[0]}&_udhi=${data.priceRange[1]}&_pgn=`;

            while(nextPageButtonSelectorEnabled) {
                await page1.goto(`${link}${pageNumber}`, {
                    networkIdleTimeout: 5000,
                    waitUntil: 'networkidle0',
                    timeout: 3000000
                });
                await page1.waitForSelector(ebay.resultsCountSelector)

                const $ = cheerio.load(await page1.content());

                const getResultsNum = $(ebay.resultsCountSelector).find('span').slice(0, 1).text()
                const resultMore60 = getResultsNum > 60

                nextPageButtonSelectorEnabled = resultMore60;
                if(nextPageButtonSelectorEnabled) {
                    await page1.waitForSelector(ebay.nextPageButtonSelector);
                    if($(ebay.nextPageButtonSelector).attr('aria-disabled')) nextPageButtonSelectorEnabled = false;
                }

                console.log(pageNumber);

                $(ebay.productsListSelector).find(ebay.productInfoSelector).slice(0, resultMore60 ? 60 : getResultsNum).each((_, elem) => {
                    result.push({
                        title: $(elem).find(ebay.productInfo.title).text(),
                        link: $(elem).find(ebay.productInfo.link).attr('href'),
                        price: $(elem).find(ebay.productInfo.price).text(),
                        image: $(elem).find(ebay.productInfo.image).find('img').attr('src'),
                    });
                });

                for (let elem of result) {
                    await page2.goto(elem.link, {
                        networkIdleTimeout: 5000,
                        waitUntil: 'networkidle0',
                        timeout: 3000000
                    });
                    await page2.waitForSelector(ebay.sellerInfo.sellerSection);
                    const $$ = cheerio.load(await page2.content());

                    elem.sellerURL = $$(ebay.sellerInfo.sellerSection).find('li.ux-seller-section__item').find('a').slice(0, 1).attr('href');
                    elem.reviews = $$(ebay.sellerInfo.sellerSection).find('li.ux-seller-section__item').find('a').slice(1, 2).find('span').text();
                    elem.positiveReviews = $$(ebay.sellerInfo.sellerSection).find('li.ux-seller-section__item').slice(1, 2).find('span.ux-textspans').text().slice(0, $$('ul.ux-seller-section__content').find('li.ux-seller-section__item').slice(1, 2).find('span.ux-textspans').text().search('%') + 1);
                    elem.location = $$('div.ux-layout-section__row').find('div.col-9').find('span.ux-textspans--SECONDARY').text().slice($$('div.ux-layout-section__row').find('div.col-9').find('span.ux-textspans--SECONDARY').text().search(': ') + 2);
                    elem.sellerSales = $$('div.d-stores-info-categories__container__info__section').find('div.d-stores-info-categories__container__info__section__item').slice(1, 2).find('span.ux-textspans--BOLD').text()

                    await ctx.telegram.sendPhoto(ctx.chat.id, elem.image, { parse_mode: 'HTML', caption:
                            `🗂 <code>${elem.title}</code>\n💵 <code>${elem.price}</code>\n📍 <code>${elem.location}</code>\n🔄 <code>${elem.sellerSales}</code>\n💬 <code>${elem.reviews} отзывов (${elem.positiveReviews} положительных)</code>\n\n<a href='${elem.link}'>🔗 Ссылка на товар</a>\n<a href='${elem.sellerURL}'>🔗 Ссылка на продавца</a>`
                    });
                }

                pageNumber++;
                console.log(result.flat());
            }
        }
        await browser.close();
    } catch(e) {
        console.log(e);
        await browser.close();
    }
}