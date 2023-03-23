const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

const {ebay} = require("../constants");

exports.parsing = async (ctx, data) => {
    let browser = await puppeteer.launch({
        headless: false,
        slowMo: 100,
        devtools: true
    });

    let page = await browser.newPage()
    await page.setViewport({
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
                await page.goto(`${link}${pageNumber}`, {
                    networkIdleTimeout: 5000,
                    waitUntil: 'networkidle0',
                    timeout: 3000000
                });
                await page.waitForSelector(ebay.resultsСountSelector);

                const $ = cheerio.load(await page.content());

                if($(ebay.resultsСountSelector).find('span').slice(0, 1).text() <= 60) nextPageButtonSelectorEnabled = false;
                if(nextPageButtonSelectorEnabled) {
                    await page.waitForSelector(ebay.nextPageButtonSelector);
                    if($(ebay.nextPageButtonSelector).attr('aria-disabled')) nextPageButtonSelectorEnabled = false;
                }

                console.log(pageNumber);

                $(ebay.productsListSelector).find(ebay.productInfoSelector).each((idx, elem) => {
                    result.push(
                        {
                            title: $(elem).find(ebay.productInfo.title).text(),
                            link: $(elem).find(ebay.productInfo.link).attr('href'),
                            price: $(elem).find(ebay.productInfo.price).text(),
                            image: $(elem).find(ebay.productInfo.image).find('img').attr('src'),
                        },
                    );
                });

                await result.forEach(element => {
                    ctx.telegram.sendPhoto(ctx.chat.id, element.image, { parse_mode: 'HTML', caption:
                        `Товар: <code>${element.title}</code>\nЦена: <code>${element.price}</code>\n<a href='${element.link}'>Ссылка</a>`
                    });
                });

                pageNumber++;
                console.log(result.flat());
            }
        }
        await browser.close();
    } catch(e) {
        console.log(e); //
        await browser.close();
    }
}