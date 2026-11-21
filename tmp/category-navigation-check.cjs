const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 const page=await browser.newPage();
 const names={western:'Western Fashion',fashion:'Pakistani Fashion',maxi:'Maxi','kids-collection':'Kids Collection'};
 page.setDefaultTimeout(10000); page.setDefaultNavigationTimeout(15000); const requests=[];
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.pathname.endsWith('/universalFilter')){
   const c=u.searchParams.get('category')||'all'; requests.push({category:c,page:u.searchParams.get('page')});
   const product={_id:'6b0145c58c34dfb338ce8368',productId:1,title:c+' only product',slug:c+'-product',description:'',images:['/zainab-logo.png'],price:3500,comparePrice:4000,category:[c],sizes:['S'],colors:[],isNew:true,stock:true,status:'active',activeDiscount:null};
   return route.fulfill({json:{success:true,data:[product],total:18,totalPages:2}});
  }
  if(u.pathname.endsWith('/categories')) return route.fulfill({json:{success:true,data:Object.entries(names).map(([slug,name])=>({slug,name,image:{url:'/zainab-logo.png'},status:'active',order:1}))}});
  return route.continue();
 });
 await page.goto('http://localhost:3000/shop',{waitUntil:'domcontentloaded'}); await page.addStyleTag({content:'.subscribe-popup-overlay { display: none !important; }'});
 await page.getByRole('heading',{name:'Shop All',exact:true}).waitFor();
 console.log('Loaded shop'); for(const c of ['western','fashion','maxi','kids-collection','western']){
  await page.getByRole('button',{name:'Toggle menu',exact:true}).click();
  await page.locator('.navbar2-drawer a[href="/shop?category='+c+'"]').first().click();
  await page.getByRole('heading',{name:names[c],exact:true}).waitFor();
  await page.getByText(c+' only product',{exact:true}).first().waitFor();
  assert.equal(await page.locator('.shop-page__title').textContent(),names[c]); console.log('Verified '+c);
 }
 await page.locator('.shop-pagination-btn').filter({hasText:/^Next$/}).click();
 await page.waitForFunction(()=>document.querySelector('.shop-pagination-btn.active')?.textContent==='2');
 await page.getByRole('button',{name:'Toggle menu',exact:true}).click();
  await page.locator('.navbar2-drawer a[href="/shop?category=fashion"]').first().click();
 await page.getByRole('heading',{name:'Pakistani Fashion',exact:true}).waitFor();
 assert.equal((await page.locator('.shop-pagination-btn.active').textContent()).trim(),'1');
 await page.goBack({waitUntil:'domcontentloaded'});
 await page.getByRole('heading',{name:'Western Fashion',exact:true}).waitFor();
 console.log('PASS: Shop All -> Western -> Pakistani -> Maxi -> Kids -> Western; pagination reset and browser back.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});





