const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../../..');
require(root + '/backend/node_modules/dotenv').config({path:root+'/backend/.env',quiet:true});
const mongoose = require(root + '/backend/node_modules/mongoose');
async function main(){
  await require(root + '/backend/src/config/db')();
  const Product = require(root + '/backend/src/models/ProductModel');
  const slugs = JSON.parse(fs.readFileSync(__dirname+'/published-products.json')).map(p=>p.slug);
  const before = await Product.find({slug:{$in:slugs}}).select('slug isBestSeller isNew showInYouMayAlsoLike displayOrder').lean();
  if(before.length!==4) throw Error('Expected four suits');
  const backup=__dirname+'/collection-flags-before.json';
  if(!fs.existsSync(backup)) fs.writeFileSync(backup,JSON.stringify(before,null,2));
  await Product.updateMany({slug:{$in:slugs}},{$set:{isBestSeller:true,isNew:true,showInYouMayAlsoLike:true,displayOrder:1}},{runValidators:true});
  const after=await Product.find({slug:{$in:slugs}}).select('slug isBestSeller isNew showInYouMayAlsoLike displayOrder').lean();
  if(after.some(p=>!p.isBestSeller||!p.isNew||!p.showInYouMayAlsoLike)) throw Error('Verification failed');
  console.log(JSON.stringify(after,null,2));
}
main().catch(e=>{console.error(e.message);process.exitCode=1}).finally(()=>mongoose.disconnect());
