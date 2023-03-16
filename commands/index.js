const puppeteer = require('puppeteer');

const link = 'https://www.ebay.es/b/Moviles-y-smartphones/9355/bn_16554114?_pgn=';

exports.start = async (ctx) => {
    await ctx.telegram.sendMessage(ctx.chat.id, 'Market scraper!', {
        /*reply_markup: {
            /*keyboard: [[
                {text: '/scrap'},
                {text: '/com2'}
            ]],
            resize_keyboard: true
        }*/
    });
};

exports.scrap = async (ctx) => {
    let flag = true
    let res = []
    let counter = 1

    try {
        let browser = await puppeteer.launch({
            headless: true,
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

            let html = await page.evaluate(async () => {
                let page = []

                try {
                    let divs = document.querySelectorAll('div.s-item__wrapper')
                
                    divs.forEach(div => {
                        let obj = {
                            title: div.querySelector('h3.s-item__title') !== null
                                ? div.querySelector('h3.s-item__title').innerText
                                : 'NO TITLE',
                            link: div.querySelector('a.s-item__link').href,
                            price: div.querySelector('span.s-item__price') != null
                                ? div.querySelector('span.s-item__price').innerText
                                : 'NO PRICE'
                        }

                        page.push(obj)
                    })
                } catch (e) {
                    console.log(e)
                }

                return page
            }, {waitUntil: 'a.pagination-widget__page-link_next'})

            await res.push(html)

            flag = false // !

            for(let i in res) {
                if(res[i].length === 0) flag = false
            }

            counter++
        }
        await browser.close()

        res = res.flat()

        //console.log(res);
    } catch(e) {
        console.log(e)
        await browser.close()
    }

    await ctx.telegram.sendMessage(ctx.chat.id, JSON.stringify(res[0]));
};