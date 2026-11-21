const fs=require('fs'),path=require('path'),sharp=require('sharp');
const root=path.resolve(__dirname,'../..');
require(root+'/backend/node_modules/dotenv').config({path:root+'/backend/.env',quiet:true});
const mongoose=require(root+'/backend/node_modules/mongoose');
const cloudinary=require(root+'/backend/src/config/cloudinary');
const crops=[
 ['fabric-feedback','WhatsApp Image 2026-11-21 at 12.50.28 PM.jpeg',0,190,720,980],
 ['parcel-feedback','WhatsApp Image 2026-11-21 at 12.50.29 PM (1).jpeg',0,191,720,1199],
 ['outfit-feedback','WhatsApp Image 2026-11-21 at 12.50.29 PM (2).jpeg',0,153,576,957],
 ['received-feedback','WhatsApp Image 2026-11-21 at 12.50.29 PM.jpeg',0,0,719,707],
];
async function main(){
 fs.mkdirSync(path.join(__dirname,'full'),{recursive:true});
 const assets={};
 for(const [key,file,left,top,width,height] of crops){
  const out=path.join(__dirname,'full',key+'.png');
  await sharp(path.join(__dirname,'source',file)).extract({left,top,width,height}).png().toFile(out);
  if(!process.argv.includes('--publish'))continue;
  const result=await cloudinary.uploader.upload(out,{public_id:'reviews/customer-feedback-2026-11-21-full/'+key,overwrite:false,resource_type:'image'});
  assets[key]=result.secure_url;
 }
 if(!process.argv.includes('--publish'))return console.log('Prepared four complete screenshot crops.');
 await require(root+'/backend/src/config/db')();
 const Review=require(root+'/backend/src/models/ReviewModel');
 const old=JSON.parse(fs.readFileSync(path.join(__dirname,'uploaded.json')));
 const before=await Review.find({active:true}).lean();
 fs.writeFileSync(path.join(__dirname,'before-full-replacement.json'),JSON.stringify(before,null,2));
 await Review.updateOne({screenshot:old['quality-feedback']},{$set:{active:false}});
 for(const [key] of crops){
  const result=await Review.updateOne({screenshot:{$in:[old[key],assets[key]]}},{$set:{screenshot:assets[key]}});
  if(result.matchedCount!==1)throw Error('Expected one review for '+key);
 }
 const reviews=await Review.find({active:true}).sort({order:1,createdAt:-1}).lean();
 if(reviews.filter(r=>r.screenshot).length!==4||reviews.some(r=>r.screenshot===old['quality-feedback']))throw Error('Verification failed');
 fs.writeFileSync(path.join(__dirname,'full-uploaded.json'),JSON.stringify(assets,null,2));
 fs.writeFileSync(path.join(__dirname,'published.json'),JSON.stringify(reviews,null,2));
 console.log('Removed fifth review and replaced four screenshot reviews with complete versions.');
}
main().catch(e=>{console.error(e.message);process.exitCode=1}).finally(()=>mongoose.disconnect());
