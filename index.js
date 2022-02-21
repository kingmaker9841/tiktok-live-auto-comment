import express from "express"
import dotenv from "dotenv"
import puppeteer from "puppeteer-extra"
import StealthPlugin from "puppeteer-extra-plugin-stealth"
// import { quotes } from "./quotes.js"
import { grow } from "./grow.js"
import { follow } from "./follow.js"
import fs from "fs"

dotenv.config()
const app = express()

puppeteer.use(StealthPlugin())

const pupLaunch = async () => {
  try {
    const browser = await puppeteer.launch({ headless: false, ignoreDefaultArgs: ['--mute-audio'], args: ['--disable-web-security'] });
    const page = await browser.newPage();

    try {
      await page.goto("https://tiktok.com/login", {
        waitUntil: "networkidle0"
      })
    } catch (err) {
      browser.close()
      pupLaunch()
    }

    await page.evaluate(() => {
      let el = document.querySelectorAll("div.channel-item-wrapper-2gBWB")[3]
      el.click()
    })

    browser.on("targetcreated", async () => {
      const pageList = await browser.pages()
      const newPage = pageList[pageList.length - 1]

      if (newPage.url().includes("https://accounts.google.com/o/oauth2/v2/auth/identifier?")) {
        await newPage.waitForSelector('#identifierId', { visible: true });
        await newPage.type('#identifierId', process.env.email, { delay: 5 })
        await newPage.click('.VfPpkd-RLmnJb')

        await newPage.waitForNavigation();

        await newPage.waitForSelector('input[type="password"]', { visible: true });
        await newPage.type('input[type="password"]', process.env.password)

        await newPage.click('.VfPpkd-RLmnJb')
      }
    })

    browser.on("targetdestroyed", async () => {
      console.log("Destroyed")
      const pageList = await browser.pages()
      const newPage = pageList[pageList.length - 1]
      await newPage.waitForNavigation()

      await newPage.goto(process.env.tiktokLiveSite)

      // let flag= true
      setInterval(async () => {
        await newPage.waitForSelector(".tiktok-17dc6b0-DivEmojiButton", { visible: true })
        await newPage.click(".tiktok-17dc6b0-DivEmojiButton")

        // console.log(random)
        // for (let i = 0; i < random; i++) {
        //   await page.waitForSelector(".tiktok-84kww3-LiItem", { visible: true })
        //   await page.click('.tiktok-84kww3-LiItem')
        // }

        await page.waitForSelector(".tiktok-84kww3-LiItem", { visible: true })
        await page.click('.tiktok-84kww3-LiItem')

        await page.waitForSelector(".tiktok-1l3yes2-DivEmojiButton", { visible: true })
        await page.click(".tiktok-1l3yes2-DivEmojiButton")

        await page.waitForSelector('.tiktok-1vgtakc-DivPostButton', { visible: true })
        await page.click('.tiktok-1vgtakc-DivPostButton')

        await newPage.setRequestInterception(true)
        newPage.on('request', async (request) => {

          if (request.isInterceptResolutionHandled()) return

          if (request.url().indexOf('/?aid') > -1 && request.url().toLowerCase().includes('content') && request.method() === "POST") {
            // console.log(request.method())
            const url = new URL(request.url().toString())
            const search_params = url.searchParams;
            // let randomQuote = Math.ceil(Math.random() * quotes.length)
            // search_params.set("content", `${quotes[randomQuote].quote} \n-${quotes[randomQuote].author}`)
            // let randomGrow = Math.floor(Math.random() * grow.length - 1)
            // console.log("Random Grow", randomGrow)
            let randomFollow = Math.floor(Math.random() * follow.length)
            console.log("Random Follow", randomFollow)
            search_params.set("content", `${follow[randomFollow]}`)
            url.search = search_params.toString()
            const new_url = url.toString()
            fs.appendFile("requestQuery.txt", search_params + "\n", (err) => console.log(err))
            return await request.continue({
              url: new_url,
              method: request.method(),
              // postData: "user.allow_strange_comment=true&user.allow_unfollower_comment=true&user.allow_show_in_gossip=true",
              headers: {
                ...request.headers()
              }
            })
          }
          await request.continue()
        })
      }, [process.env.interval])

      // newPage.on("response", async (response) => {
      //   const request = response.request()
      //   // console.log(request.url())
      //   if (request.url().indexOf('/?aid') > -1) {
      //     const text = await response.text()
      //     fs.appendFile("allResponse.txt", text + "\n", (err) => {
      //       if (err) console.error("All Response Error", err)
      //     })
      //   }
      //   if (request.url().indexOf('/?aid') > -1 && request.url().toLowerCase().includes('content') && request.method() === "POST") {
      //     const text = await response.text()
      //     fs.appendFile("response.txt", text + "\n", (err) => {
      //       if (err) console.error(err)
      //     })
      //   }
      // })
    })
  } catch (err) {
    console.log(err)
  }
}

pupLaunch()

const PORT = process.env.PORT

process.on("unhandledRejection", (reason, p) => {
  console.error('Unhandled Rejection at: Promise', p)
  console.error('Reason', reason)
})

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`)
})