const puppeteer = require("puppeteer");
const ObjectToCsv = require("objects-to-csv");


function extractUserNames(){
   const extractedItems = Array.from(document.querySelectorAll("div.d7ByH > a"));
   const items = extractedItems.map(element => element.innerText);
   return items;
}

async function scrapeInfiniteScrollUserNames(target, page, company){
    target = 500;
    const scrapeList = [];
    let items = [];
    try{
        let previousHeight;
        while(items.length < target){
            items = await page.evaluate(extractUserNames);
            previousHeight = await page.evaluate("document.getElementsByClassName('isgrP')[0].scrollHeight");
            await page.evaluate("document.getElementsByClassName('isgrP')[0].scrollTo(0,document.getElementsByClassName('isgrP')[0].scrollHeight)");
            await page.waitForFunction(
                `document.getElementsByClassName('isgrP')[0].scrollHeight > ${previousHeight}`
            );

            await page.waitFor(1000);
        }
    }catch (error){
        console.log(error);
    }
    items.map(username => {
        const rest = {username, company}
        scrapeList.push(rest);
    });
    return scrapeList;
}

async function main(){
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();

    await page.goto("https://www.instagram.com/accounts/login/",{
        waitUntil: 'networkidle0'
      });
    await page.type('input[name="username"]', ''); //username
    await page.type('input[name="password"]', '');//password
    await page.click('button[type="submit"]');
    await page.waitForNavigation({
        waitUntil: 'networkidle0'
    });

    await page.goto("https://www.instagram.com/google/", {waitUntil: 'networkidle0'});
    await page.click('a.-nal3');
    // await page.waitForNavigation({
    //     waitUntil: 'networkidle0'
    // });

    await page.waitFor(2000);
    await page.evaluate("document.getElementsByClassName('isgrP')[0].scrollTo(100,500)");
    await page.waitFor(1000);
    const target = await page.evaluate('document.getElementsByClassName("g47SY")[1].innerText');
    const company = await page.evaluate('document.getElementsByClassName("_7UhW9")[0].innerText');
    const num = parseFloat(target.replace(/,/g, ''));
    console.log(num);
    const rst = await scrapeInfiniteScrollUserNames(num,page,company);
    console.log(rst);
    await writeToCsv(rst);


    page.close();

}

async function writeToCsv(data){
    let csv = new ObjectToCsv(data);

    await csv.toDisk('./sample.csv');
}

main();
