const sharp=require('sharp');
const fs=require('fs');
const path=require('path');
const crops=[
 ['fabric-feedback','WhatsApp Image 2026-11-21 at 12.50.28 PM.jpeg',0,725,720,445],
 ['parcel-feedback','WhatsApp Image 2026-11-21 at 12.50.29 PM (1).jpeg',0,625,720,765],
 ['outfit-feedback','WhatsApp Image 2026-11-21 at 12.50.29 PM (2).jpeg',0,845,576,260],
 ['received-feedback','WhatsApp Image 2026-11-21 at 12.50.29 PM.jpeg',0,0,719,240],
 ['quality-feedback','WhatsApp Image 2026-11-21 at 12.50.30 PM.jpeg',0,995,576,100],
];
(async()=>{fs.mkdirSync(path.join(__dirname,'cropped'),{recursive:true});for(const [key,file,left,top,width,height] of crops){await sharp(path.join(__dirname,'source',file)).extract({left,top,width,height}).png().toFile(path.join(__dirname,'cropped',key+'.png'));}fs.writeFileSync(path.join(__dirname,'crops.json'),JSON.stringify(crops,null,2));console.log('Prepared five exact screenshot crops without contact headers or quoted numbers.');})().catch(e=>{console.error(e);process.exitCode=1});
