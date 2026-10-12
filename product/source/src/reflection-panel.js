import {MM27_DRIVERS} from './monitor-model.js';
import {ACOUSTIC_MATERIALS,ACOUSTIC_SURFACES,OCTAVE_BANDS} from './acoustic-simulation.js';
export function setupReflectionPanel({read,change,readAcoustics,changeAcoustics}){
 const $=id=>document.getElementById(id),list=$('reflection-list');
 for(const driver of MM27_DRIVERS){const row=document.createElement('div');row.className='reflection-row';const name=document.createElement('span');name.className='reflection-name';name.textContent=driver.label;name.style.setProperty('--driver-color','#'+driver.color.toString(16).padStart(6,'0'));row.append(name);
  for(const channel of ['L','R']){const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.id='reflect-'+channel+'-'+driver.id;input.dataset.key=channel+':'+driver.id;input.setAttribute('aria-label',driver.label+' · '+channel);label.append(input,document.createTextNode(channel));row.append(label);input.onchange=()=>change({...read(),selected:[...list.querySelectorAll('input:checked')].map(o=>o.dataset.key)});}
  list.append(row);
 }
 const acousticSection=document.createElement('section');acousticSection.className='acoustic-report';
 acousticSection.innerHTML='<hr><h2>Symulacja akustyczna</h2><p class="muted">Pierwsze odbicia: przybliżony czas i poziom względem dźwięku bezpośredniego. Współczynniki materiałów są założeniami, nie pomiarem tego pokoju.</p><label>Pasmo<select id="acoustic-band"></select></label><h3>Dźwięk bezpośredni</h3><p id="acoustic-direct" class="muted"></p><h3>Najsilniejsze pierwsze odbicia</h3><ol id="acoustic-reflection-results"></ol><h3>Mody pokoju do 200 Hz</h3><p id="acoustic-mode-note" class="muted"></p><ol id="acoustic-modes"></ol><details class="acoustic-settings"><summary>Materiały i wyposażenie w symulacji</summary><h3>Materiały powierzchni</h3><div id="acoustic-materials"></div><h3>Wyposażenie ukryte w widoku</h3><label class="check"><input id="acoustic-hidden-rack" type="checkbox"> Uwzględnij rack w obliczeniach</label><label class="check"><input id="acoustic-hidden-desk" type="checkbox"> Uwzględnij urządzenia na biurku</label></details><p class="muted">Mody obliczono dla prostokątnego przybliżenia pokoju. Model nie uwzględnia odpowiedzi monitorów, fazy, dyfrakcji, transmisji przez przegrody ani pomiarów w tym pomieszczeniu.</p>';
 $('reflections-panel').querySelector('h1').after(acousticSection);
 const bandSelect=$('acoustic-band');for(const band of OCTAVE_BANDS){const option=document.createElement('option');option.value=String(band);option.textContent=band<1000?band+' Hz':band/1000+' kHz';bandSelect.append(option);}
 const materialRows=new Map();
 for(const [category,label] of Object.entries(ACOUSTIC_SURFACES)){
  const row=document.createElement('label');row.className='acoustic-material-row';
  const title=document.createElement('span');title.textContent=label;
  const select=document.createElement('select');select.setAttribute('aria-label',label+' — materiał akustyczny');
  for(const [id,material] of Object.entries(ACOUSTIC_MATERIALS)){const option=document.createElement('option');option.value=id;option.textContent=material.label;select.append(option);}
  const coefficient=document.createElement('small');row.append(title,select,coefficient);$('acoustic-materials').append(row);materialRows.set(category,{select,coefficient});
  select.onchange=()=>changeAcoustics({...readAcoustics(),materials:{...readAcoustics().materials,[category]:select.value}});
 }
 bandSelect.onchange=()=>changeAcoustics({...readAcoustics(),band:Number(bandSelect.value)});
 $('acoustic-hidden-rack').onchange=()=>changeAcoustics({...readAcoustics(),includeHiddenRack:$('acoustic-hidden-rack').checked});
 $('acoustic-hidden-desk').onchange=()=>changeAcoustics({...readAcoustics(),includeHiddenDeskEquipment:$('acoustic-hidden-desk').checked});
 const decimal=(n,d=1)=>n.toLocaleString('pl-PL',{minimumFractionDigits:d,maximumFractionDigits:d});
 const driverName=id=>MM27_DRIVERS.find(driver=>driver.id===id)?.label??id;
 function renderReport(report){
  if(!report)return;
  const bandIndex=OCTAVE_BANDS.indexOf(report.band);
  const times=report.direct.map(item=>item.timeMs);
  $('acoustic-direct').textContent=times.length?`${report.direct.length} dróg · czas dotarcia ${decimal(Math.min(...times))}–${decimal(Math.max(...times))} ms`:'Nie wybrano przetworników.';
  const results=$('acoustic-reflection-results');results.replaceChildren();
  const strongest=[...report.reflections].sort((a,b)=>b.relativeLevelDb[bandIndex]-a.relativeLevelDb[bandIndex]).slice(0,10);
  for(const path of strongest){const item=document.createElement('li'),ear=path.ear==='left'?'lewe':'prawe';item.textContent=`${path.channel} · ${driverName(path.driverId)} → ${ear} ucho · ${ACOUSTIC_SURFACES[path.category]}: +${decimal(path.delayMs,2)} ms, ${decimal(path.relativeLevelDb[bandIndex])} dB`;results.append(item);}
  if(!strongest.length){const item=document.createElement('li');item.textContent='Brak pierwszych odbić dla bieżącego wyboru.';results.append(item);}
  $('acoustic-mode-note').textContent=report.approximateModes?'Obrys pokoju jest edytowany — poniższe częstotliwości są wyłącznie przybliżeniem z wymiarów prostokąta.':'Częstotliwości wynikają z wymiarów prostokątnego przybliżenia; wnęka i konstrukcja ścian mogą je przesunąć.';
  const modes=$('acoustic-modes');modes.replaceChildren();for(const mode of report.modes.slice(0,12)){const item=document.createElement('li');item.textContent=`${decimal(mode.frequency)} Hz · (${mode.indices.join(', ')}) · ${mode.kind}`;modes.append(item);}
 }
 function sync(count,report){const settings=read();$('reflections-visible').checked=settings.visible;$('reflection-paths').checked=settings.paths;$('reflection-ears').value=settings.ears;for(const input of list.querySelectorAll('input'))input.checked=settings.selected.includes(input.dataset.key);if(count!==undefined)$('reflection-count').textContent='Punkty odbić: '+count;
  const acoustic=readAcoustics();bandSelect.value=String(acoustic.band);$('acoustic-hidden-rack').checked=acoustic.includeHiddenRack;$('acoustic-hidden-desk').checked=acoustic.includeHiddenDeskEquipment;
  for(const [category,{select,coefficient}] of materialRows){select.value=acoustic.materials[category];coefficient.textContent=`Pochłanianie α przy ${acoustic.band} Hz: ${decimal(ACOUSTIC_MATERIALS[select.value].absorption[OCTAVE_BANDS.indexOf(acoustic.band)],2)}`;}
  renderReport(report);
 }
 $('reflections-visible').onchange=()=>change({...read(),visible:$('reflections-visible').checked});$('reflection-paths').onchange=()=>change({...read(),paths:$('reflection-paths').checked});$('reflection-ears').onchange=()=>change({...read(),ears:$('reflection-ears').value});
 $('reflection-all').onclick=()=>change({...read(),selected:[...list.querySelectorAll('input')].map(o=>o.dataset.key)});$('reflection-tweeter').onclick=()=>change({...read(),selected:['L:tweeter','R:tweeter']});$('reflection-none').onclick=()=>change({...read(),selected:[]});
 return {sync};
}
