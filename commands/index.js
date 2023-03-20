const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

const link = 'https://www.ebay.es/sch/i.html?_from=R40&_nkw=iphone&_sacat=9355&_pgn=';

exports.start = async (ctx) => {
    await ctx.telegram.sendMessage(ctx.chat.id, 'use /scrap', {
        /*reply_markup: {
            /*keyboard: [[
                {text: '/scrap'},
                {text: '/com2'}
            ]],
            resize_keyboard: true
        }*/
    });
};

/*
    Leboncoin
    Ebay.es
*/

exports.scrap = async (ctx) => {
    let flag = true
    let res = []
    let counter = 1

    try {
        let browser = await puppeteer.launch({
            headless: false,
            slowMo: 100,
            devtools: true
        })
        let page = await browser.newPage()
        await page.setViewport({
            width: 1400,
            height: 900
        })

        while(flag) {
            await page.goto(`${link}${counter}`, {
                networkIdleTimeout: 5000,
                waitUntil: 'networkidle0',
                timeout: 3000000
            })
            await page.waitForSelector('a.pagination__next')
            console.log(counter)

            const content = await page.content();

            const $ = cheerio.load(content);

            $('ul.srp-results').find('li.s-item').each((idx, elem) => {
                let obj = {
                    title: $(elem).find('div.s-item__title').text(),
                    link: $(elem).find('a.s-item__link').attr('href'),
                    price: $(elem).find('span.s-item__price').text(),
                    image: $(elem).find('div.s-item__image-wrapper').find('img').attr('src'),
                }
                res.push(obj);
            })

            /* ПОТОМ
            await res.forEach(element => {
                ctx.telegram.sendPhoto(ctx.chat.id, element.image, { parse_mode: 'HTML', caption:
                    `Товар: <pre>${element.title}</pre>/nЦена: ${element.price}/nСсылка:`
                });
            });
            //*/
            
            flag = false // !

            for(let i in res) {
                if(res[i].length === 0) flag = false
            }

            counter++
        }
        await browser.close()

        res = res.flat()

        console.log(res);
    } catch(e) {
        console.log(e)
        //await browser.close() // undefined ?
    }
};