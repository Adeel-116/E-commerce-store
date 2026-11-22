const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const dir = __dirname;
const downloads = path.join(process.env.USERPROFILE, 'Downloads');
const sources = {
  navy: ['Navy Pleated Palazzo Look Outdoors.png', 'Navy Palazzo Outfit on Gold Rack.png'],
  black: ['Elegant black palazzo courtyard portrait.png', 'Black palazzo outfit on wooden hangers.png'],
  crimson: ['Maroon tunic and palazzo portrait.png', 'Crimson co-ord set on gold rack.png'],
  'powder-blue': ['Powder blue shirt with smooth sleeves.png', 'Dusty Blue Pleated Shirt and Palazzo Set.png'],
};
const charts = [
  {title:'Top Shirt', unit:'inches', sizes:['S','M','L'], rows:[
    {label:'Length',values:['34.5','35','35.5']},
    {label:'Shoulders',values:['15.5','16','16.5']},
    {label:'Chest (Round)',values:['45.5','46','46.5']},
    {label:'Sleeve Length',values:['19.5','20','20.5']},
    {label:'Sleeve Opening',values:['5.5','6','6.5']},
  ]},
  {title:'Palazzo', unit:'inches', sizes:['S','M','L'], rows:[
    {label:'Length',values:['37.5','38','38.5']},
    {label:'Waist (Relaxed)',values:['27.5','28','28.5']},
    {label:'Waist (Stretched)',values:['47.5','48','48.5']},
    {label:'Hips',values:['47.5','48','48.5']},
    {label:'Bottom Opening',values:['14','14.5','15']},
  ]},
];
async function main(){
  for(const [color,files] of Object.entries(sources)) {
    fs.mkdirSync(path.join(dir,color),{recursive:true});
    for(const [i,file] of files.entries()) fs.copyFileSync(path.join(downloads,file),path.join(dir,color,i===0?'01-model.png':'02-hanger.png'));
  }
  fs.writeFileSync(path.join(dir,'measurements.json'),JSON.stringify(charts,null,2));
  const esc=s=>s.replaceAll('&','&amp;');
  let svg='<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1420"><rect width="1200" height="1420" fill="#faf6f0"/><g font-family="Arial, sans-serif" fill="#202323"><text x="72" y="100" font-size="24" letter-spacing="5">ZARYA STYLE</text><text x="72" y="180" font-size="60" font-weight="700">Two Piece Suit Size Guide</text><text x="72" y="232" font-size="26" fill="#626664">Shared guide for all four colours · Measurements in inches</text>';
  charts.forEach((chart,index)=>{
    const y=305+index*500;
    svg+=`<text x="72" y="${y}" font-size="36" font-weight="700">${chart.title}</text><rect x="72" y="${y+30}" width="1056" height="64" rx="8" fill="#303d35"/>`;
    ['Measurement','S','M','L'].forEach((v,i)=>svg+=`<text x="${[96,660,850,1040][i]}" y="${y+72}" font-size="27" fill="white" font-weight="700" ${i?'text-anchor="middle"':''}>${v}</text>`);
    chart.rows.forEach((row,r)=>{
      const ry=y+94+r*61;
      svg+=`<rect x="72" y="${ry}" width="1056" height="61" fill="${r%2?'#eeeae2':'#fffdf9'}"/>`;
      [row.label,...row.values].forEach((v,i)=>svg+=`<text x="${[96,660,850,1040][i]}" y="${ry+40}" font-size="27" ${i?'text-anchor="middle"':''}>${esc(v)}</text>`);
    });
  });
  svg+='<text x="72" y="1315" font-size="24" fill="#626664">Use these garment measurements to compare with a similar outfit.</text><text x="72" y="1356" font-size="24" fill="#626664">Chest values are round measurements, as supplied in the original chart.</text></g></svg>';
  fs.writeFileSync(path.join(dir,'shared-size-guide.svg'),svg);
  await sharp(Buffer.from(svg)).png().toFile(path.join(dir,'shared-size-guide.png'));
  console.log('Prepared eight original photos and shared S/M/L chart.');
}
main().catch(e=>{console.error(e);process.exitCode=1});
