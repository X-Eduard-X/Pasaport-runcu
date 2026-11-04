import fs from 'node:fs';
import path from 'node:path';

const filePath = path.resolve('public/data/stories.json');
const raw = fs.readFileSync(filePath, 'utf8');
const data = JSON.parse(raw);

const REPLACEMENTS = {
  'a-chei-rau': 'Apa limpede a Sohodolului străbate pragurile de piatră, creând mici cascade și ochiuri de apă răcoroase unde păstrăvii își găsesc adăpostul natural.',
  'a-varful-arcanu': 'De pe creasta Arcanului, privirea cuprinde întreaga depresiune a Olteniei de sub munte, de la meandrele Jiului până la satele luminate ale Runcului.',
  'a-drum-priveliste': 'Șoseaua montană șerpuiește printre păduri seculare de fag și molid, oferind călătorilor popasuri pitorești și priveliști spectaculoase spre stâncile albe.',
  'a-poteca-padure': 'Traseele montane bine umbrite străbat covorul gros de mușchi și frunze, ghidând pașii drumeților spre izvoare reci și poieni ascunse în inima muntelui.',
  'a-interior-candelabru': 'Lumina caldă a lumânărilor reflectată în brațele aurite ale policandrului aduce o liniște solemnă peste chipurile sfinților zugrăviți în frescă tradițională.',
  'b-port-popular-ansamblu': 'Fiecare cusătură pe pânză de bumbac sau borangic poartă simboluri străvechi – colții, râurile și romburile – transmise din mamă în fiică cu răbdare și meșteșug.',
  'b-dans-hora': 'Când lăutarii pornesc ritmul iute al sârbei gorjenești, ulițele și poienile satului răsună de strigături, pași bătuți pe pământ și voie bună.',
  'b-mesteguri-torsul-lanii': 'Fusul mânuit cu pricepere toarce fire trainice de lână curată, pregătite apoi pentru războiul de țesut covoare și macaturi gorjenești cu flori de câmp.',
  'b-gastronomie-locala': 'Mâncărurile aburinde la ceaun și turtele coapte pe vatra încinsă desăvârșesc ospitalitatea renumită a gazdelor din Runcu la ceas de sărbătoare.',
  'c-personalitate-locala': 'Glasul limpede și plin de dor al Mariei Apostol a dus doinele și baladele Runcului pe cele mai mari scene ale țării, devenind o emblemă a folclorului românesc.',
  'd-rachiti-troite-lemn': 'Foișorul primitor și troița dăltuită în stejar îi întâmpină pe oaspeți la hotarul stațiunii turistice, mărturisind credința și căldura oamenilor locului.',
  'd-poveste-comunitate': 'Mirosul de fân proaspăt cosit și larma satului adunat la clacă amintesc de vremurile așezate când întreaga comunitate lucra pământul în deplină armonie.'
};

let count = 0;
data.stories.forEach(story => {
  if (REPLACEMENTS[story.id]) {
    story.slides.forEach((slide, sIdx) => {
      if (slide.text.includes('[TEXT AICI]')) {
        slide.text = REPLACEMENTS[story.id];
        count++;
        console.log(`Replaced [TEXT AICI] for ${story.id} slide ${sIdx + 1}`);
      }
    });
  }
});

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log(`[SUCCESS] Successfully replaced ${count} occurrences of [TEXT AICI]!`);
