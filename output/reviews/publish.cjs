const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..');
require(root+'/backend/node_modules/dotenv').config({path:root+'/backend/.env',quiet:true});
const mongoose=require(root+'/backend/node_modules/mongoose');
const cloudinary=require(root+'/backend/src/config/cloudinary');
const entries=[
 ['fabric-feedback','Thanks bro thanks alout fabric bh kafi acha h or boht pasnd ay hin dono article zbrdast Masha Allaha'],
 ['parcel-feedback','Percle rcv hogaya. Alhamdulilah acha Hy thank you'],
 ['outfit-feedback','Alhamdulilah acha Hy thank you'],
 ['received-feedback','Assallamulaikum bahi parcel received ho gaya Han alhumdullah buht Acha Han'],
 ['quality-feedback','AP k pass asa hi kpra k ha kpra chng ni ho ga'],
];
async function main(){
 const assets={};
 for(const [key] of entries){const result=await cloudinary.uploader.upload(path.join(__dirname,'cropped',key+'.png'),{public_id:'reviews/customer-feedback-2026-11-21/'+key,overwrite:false,resource_type:'image'});assets[key]=result.secure_url;console.log('Uploaded '+key);}
 fs.writeFileSync(path.join(__dirname,'uploaded.json'),JSON.stringify(assets,null,2));
 await require(root+'/backend/src/config/db')();
 const Review=require(root+'/backend/src/models/ReviewModel');
 const backup=JSON.parse(fs.readFileSync(path.join(__dirname,'before.json')));
 const oldShots=backup.filter(r=>r.screenshot).map(r=>new mongoose.Types.ObjectId(r._id));
 // Archive demo screenshot records; retain a backup and all text-only reviews.
 await Review.updateMany({_id:{$in:oldShots}},{$set:{active:false}});
 for(const [i,[key,text]] of entries.entries()) await Review.updateOne({screenshot:assets[key]},{$set:{name:'Customer feedback',city:'',text,screenshot:assets[key],verified:false,active:true,order:i+1}},{upsert:true,runValidators:true});
 const texts=backup.filter(r=>!r.screenshot);
 for(const [i,r] of texts.entries()) await Review.updateOne({_id:r._id},{$set:{order:100+i}});
 const saved=await Review.find({active:true}).sort({order:1,createdAt:-1}).lean();
 if(saved.slice(0,5).some(r=>!Object.values(assets).includes(r.screenshot))||saved.slice(5).some(r=>r.screenshot))throw Error('Screenshot priority verification failed');
 fs.writeFileSync(path.join(__dirname,'published.json'),JSON.stringify(saved,null,2));
 console.log('Verified '+saved.slice(0,5).length+' customer screenshots first, '+saved.slice(5).length+' text reviews second; archived '+oldShots.length+' demo screenshots.');
}
main().catch(e=>{console.error(e.message);process.exitCode=1}).finally(()=>mongoose.disconnect());
