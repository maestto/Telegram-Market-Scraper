const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

const {ebay} = require("../constants");

exports.parsing = async (ctx, data) => {
    console.log(data)
    let nextPageButtonSelectorEnabled = true
    let pageNumber = 1
    let result = []

    let link = `https://www.ebay.es/sch/i.html?_from=R40&_nkw=${encodeURIComponent(data[0])}&_sacat=9355&LH_TitleDesc=0&_pgn=`;

    let browser = await puppeteer.launch({
        headless: false,
        slowMo: 100,
        devtools: true
    })

    try {
        let page = await browser.newPage()
        await page.setViewport({
            width: 1400,
            height: 900
        })

        while(nextPageButtonSelectorEnabled) {
            await page.goto(`${link}${pageNumber}`, {
                networkIdleTimeout: 5000,
                waitUntil: 'networkidle0',
                timeout: 3000000
            })

            // ЕСЛИ РЕЗУЛЬТАТОВ СЛИШКОМ МАЛО (<= 60), nextPageButtonSelector не будет !!!!
            await page.waitForSelector(ebay.nextPageButtonSelector)

            console.log(pageNumber)

            const $ = cheerio.load(await page.content());

            if($(ebay.nextPageButtonSelector).attr('aria-disabled')) nextPageButtonSelectorEnabled = false
            $(ebay.productsListSelector).find(ebay.productInfoSelector).each((idx, elem) => {
                let obj = {
                    title: $(elem).find(ebay.productInfo.title).text(),
                    link: $(elem).find(ebay.productInfo.link).attr('href'),
                    price: $(elem).find(ebay.productInfo.price).text(),
                    image: $(elem).find(ebay.productInfo.image).find('img').attr('src'),
                }
                result.push(obj);
            })

            /*await res.forEach(element => {
                ctx.telegram.sendPhoto(ctx.chat.id, element.image, { parse_mode: 'HTML', caption:
                    `Товар: <pre>${element.title}</pre>/nЦена: ${element.price}/nСсылка:`
                });
            });*/

            pageNumber++
        }
        await browser.close()

        console.log(result.flat());
    } catch(e) {
        console.log(e)
        await browser.close()
    }
}