// Right-isosceles triangular bass traps. The diagonal always faces the room.
export const BASS_TRAP_HEIGHT=1;
export const LEFT_FRONT_HYPOTENUSE=.5;
export const LEFT_FRONT_LEG=LEFT_FRONT_HYPOTENUSE/Math.SQRT2;
export const OTHER_CORNER_LEG=.35;
export const RADIATOR_GAP=.05;

const corners=new Set(['front-left','front-right','rear-right']);

export function defaultBassTraps(room,features){
 const radiatorTop=(features?.radiator?.bottom??0)+(features?.radiator?.height??0);
 const candidates=[
  {id:'bass-trap-front-left-lower',corner:'front-left',bottom:0,height:1,hypotenuse:LEFT_FRONT_HYPOTENUSE},
  {id:'bass-trap-front-left-upper',corner:'front-left',bottom:1,height:1,hypotenuse:LEFT_FRONT_HYPOTENUSE},
  {id:'bass-trap-front-right',corner:'front-right',bottom:radiatorTop+RADIATOR_GAP,height:1,hypotenuse:OTHER_CORNER_LEG*Math.SQRT2},
  {id:'bass-trap-rear-right',corner:'rear-right',bottom:0,height:1,hypotenuse:OTHER_CORNER_LEG*Math.SQRT2},
  {id:'bass-trap-rear-right-upper',corner:'rear-right',bottom:1,height:1,hypotenuse:OTHER_CORNER_LEG*Math.SQRT2}
 ];
 return candidates.filter(item=>item.bottom+item.height<=room.height+1e-9&&item.hypotenuse/Math.SQRT2<=Math.min(room.width,room.length));
}

export function normalizeBassTraps(input,room,features){
 let records=input===undefined?defaultBassTraps(room,features):input;
 if(!Array.isArray(records)||records.length>24)throw new Error('Nieprawidłowe pułapki basowe.');
 const lower=records.find(item=>item?.id==='bass-trap-rear-right'&&item.corner==='rear-right');
 if(lower&&!records.some(item=>item?.id==='bass-trap-rear-right-upper')&&lower.bottom+2*lower.height<=room.height+1e-9){
  records=[...records,{...lower,id:'bass-trap-rear-right-upper',bottom:lower.bottom+lower.height}];
 }
 const ids=new Set();
 return records.map(item=>{
  if(!item||typeof item!=='object'||typeof item.id!=='string'||!/^bass-trap-[a-z0-9-]+$/.test(item.id)||ids.has(item.id)||!corners.has(item.corner)||!Number.isFinite(item.bottom)||!Number.isFinite(item.height)||!Number.isFinite(item.hypotenuse)||item.bottom<0||item.height<=0||item.hypotenuse<=0||item.bottom+item.height>room.height+1e-9||item.hypotenuse/Math.SQRT2>Math.min(room.width,room.length))throw new Error('Nieprawidłowa geometria pułapki basowej.');
  ids.add(item.id);
  return {id:item.id,corner:item.corner,bottom:item.bottom,height:item.height,hypotenuse:item.hypotenuse};
 });
}

export function bassTrapPlacement(record,room){
 const leg=record.hypotenuse/Math.SQRT2;
 let triangle;
 if(record.corner==='front-left')triangle=[[0,0],[leg,0],[0,leg]];
 else if(record.corner==='front-right')triangle=[[room.width,0],[room.width,leg],[room.width-leg,0]];
 else if(record.corner==='rear-right')triangle=[[room.width,room.length],[room.width-leg,room.length],[room.width,room.length-leg]];
 else throw new Error('Nieznany narożnik pułapki basowej.');
 return {id:record.id,corner:record.corner,bottom:record.bottom,top:record.bottom+record.height,height:record.height,leg,hypotenuse:record.hypotenuse,triangle,diagonal:[triangle[1],triangle[2]]};
}
