// Exploratory room-acoustics model. Coefficients are editable assumptions,
// not measured properties of this particular room or incidence-angle data.
export const OCTAVE_BANDS=Object.freeze([125,250,500,1000,2000,4000]);
export const ACOUSTIC_MATERIALS=Object.freeze({
 painted:{label:'Malowana twarda ściana · założenie',absorption:[.10,.07,.05,.04,.05,.07]},
 laminate:{label:'Podłoga laminowana · założenie',absorption:[.08,.07,.06,.05,.05,.06]},
 glass:{label:'Szkło · założenie',absorption:[.18,.08,.05,.04,.03,.03]},
 wood:{label:'Drewno / MDF · założenie',absorption:[.12,.10,.08,.07,.07,.08]},
 metal:{label:'Metal · założenie',absorption:[.03,.03,.02,.02,.02,.03]},
 absorber:{label:'Panel pochłaniający · przykład',absorption:[.20,.42,.72,.88,.92,.92]}
});
export const ACOUSTIC_SURFACES=Object.freeze({walls:'Ściany i wnęka',ceiling:'Sufit',floor:'Podłoga',window:'Okno',door:'Drzwi',radiator:'Grzejnik',desk:'Biurko',bookcase:'Regał',rack:'Rack'});
export const DEFAULT_ACOUSTIC_MATERIALS=Object.freeze({walls:'painted',ceiling:'painted',floor:'laminate',window:'glass',door:'wood',radiator:'metal',desk:'wood',bookcase:'wood',rack:'metal'});
export const DEFAULT_SOUND_SPEED=343.2; // m/s, about 20 °C

export function defaultAcousticSettings(){return {materials:{...DEFAULT_ACOUSTIC_MATERIALS},includeHiddenRack:false,includeHiddenDeskEquipment:false,band:1000};}
export function normalizeAcousticSettings(input){
 const data=input??defaultAcousticSettings();
 if(!data||typeof data!=='object'||Array.isArray(data)||!data.materials||typeof data.materials!=='object'||Array.isArray(data.materials))throw new Error('Nieprawidłowe materiały akustyczne.');
 const materials={};
 for(const category of Object.keys(ACOUSTIC_SURFACES)){
  const material=data.materials[category]??DEFAULT_ACOUSTIC_MATERIALS[category];
  if(!Object.hasOwn(ACOUSTIC_MATERIALS,material))throw new Error('Nieznany materiał akustyczny: '+material);
  materials[category]=material;
 }
 for(const key of ['includeHiddenRack','includeHiddenDeskEquipment'])if(data[key]!==undefined&&typeof data[key]!=='boolean')throw new Error('Nieprawidłowa obecność wyposażenia w symulacji.');
 const band=data.band??1000;if(!OCTAVE_BANDS.includes(band))throw new Error('Nieznane pasmo akustyczne.');
 return {materials,includeHiddenRack:data.includeHiddenRack??false,includeHiddenDeskEquipment:data.includeHiddenDeskEquipment??false,band};
}

export function acousticSurfaceCategory(id){
 if(id==='floor')return 'floor';
 if(id==='ceiling')return 'ceiling';
 if(id==='niche-back'||id.startsWith('object:window:'))return 'window';
 if(id.startsWith('object:door:'))return 'door';
 if(id.startsWith('object:radiator:'))return 'radiator';
 if(id.startsWith('object:desk-'))return 'desk';
 if(id.startsWith('object:bookcase-'))return 'bookcase';
 if(id.startsWith('object:rack-'))return 'rack';
 return 'walls';
}

export function pathAcoustics(path,directDistance,settings=defaultAcousticSettings(),soundSpeed=DEFAULT_SOUND_SPEED){
 if(!(directDistance>0)||!(path.length>=directDistance-1e-8)||!(soundSpeed>0))throw new RangeError('Nieprawidłowa droga dźwięku.');
 const category=acousticSurfaceCategory(path.surface),material=settings.materials[category],alpha=ACOUSTIC_MATERIALS[material].absorption;
 const length=Math.max(path.length,directDistance);
 return {delayMs:(length-directDistance)/soundSpeed*1000,relativeLevelDb:alpha.map(absorption=>20*Math.log10(directDistance/length)+10*Math.log10(1-absorption)),category,material};
}

export function roomModes(room,{maxHz=200,soundSpeed=DEFAULT_SOUND_SPEED}={}){
 const dimensions=[room.width,room.height,room.length];
 if(dimensions.some(value=>!(value>0))||!(maxHz>0))throw new RangeError('Nieprawidłowe wymiary pokoju.');
 const limits=dimensions.map(length=>Math.floor(2*maxHz*length/soundSpeed)),modes=[];
 for(let x=0;x<=limits[0];x++)for(let y=0;y<=limits[1];y++)for(let z=0;z<=limits[2];z++){
  const nonzero=[x,y,z].filter(Boolean).length;if(!nonzero)continue;
  const frequency=soundSpeed/2*Math.hypot(x/room.width,y/room.height,z/room.length);
  if(frequency>maxHz+1e-9)continue;
  modes.push({indices:[x,y,z],frequency,kind:nonzero===1?'osiowy':nonzero===2?'styczny':'skośny'});
 }
 return modes.sort((a,b)=>a.frequency-b.frequency||a.indices.join(',').localeCompare(b.indices.join(',')));
}

export function analyzeAcousticPaths(monitors,listener,paths,reflectionSettings,acousticSettings,room,{approximateModes=false}={}){
 const settings=normalizeAcousticSettings(acousticSettings),ears=reflectionSettings.ears==='both'?['left','right']:[reflectionSettings.ears];
 listener.group.updateMatrixWorld(true);
 const earPositions=Object.fromEntries(ears.map(ear=>[ear,listener.group.getObjectByName('ear-'+ear).getWorldPosition(listener.group.position.clone())]));
 const direct=[];
 for(const monitor of monitors)for(const driver of monitor.getDriverCenters()){
  const channel=monitor.group.userData.channel;if(!reflectionSettings.selected.includes(channel+':'+driver.id))continue;
  for(const ear of ears){const distance=driver.position.distanceTo(earPositions[ear]);direct.push({channel,driverId:driver.id,ear,distance,timeMs:distance/DEFAULT_SOUND_SPEED*1000});}
 }
 const lookup=new Map(direct.map(item=>[[item.channel,item.driverId,item.ear].join(':'),item]));
 const reflections=paths.map(path=>{
  const reference=lookup.get([path.channel,path.driverId,path.ear].join(':'));
  if(!reference)return null;
  return {...path,...pathAcoustics(path,reference.distance,settings)};
 }).filter(Boolean);
 return {direct,reflections,modes:roomModes(room),approximateModes,band:settings.band,materials:settings.materials};
}
