export function setupFeaturesPanel({read,change,showError}){
 const host=document.getElementById('features-fields'),names={door:'Drzwi · tylna ściana',window:'Wnęka · przednia ściana',radiator:'Kaloryfer · przednia ściana'},labels={center:'Środek · X',width:'Szerokość',height:'Wysokość',bottom:'Od podłogi',depth:'Głębokość'};
 for(const [name,f] of Object.entries(read())){const section=document.createElement('section');section.innerHTML='<h2>'+names[name]+'</h2>';for(const key of Object.keys(f)){const label=document.createElement('label');label.innerHTML=labels[key]+'<div><input id="feature-'+name+'-'+key+'" type="number" step="0.1" required><span>cm</span></div>';section.append(label);}host.append(section);}
 function sync(){for(const [name,f] of Object.entries(read()))for(const [key,value] of Object.entries(f))document.getElementById('feature-'+name+'-'+key).value=(value*100).toFixed(1);}
 document.getElementById('features-form').onsubmit=e=>{e.preventDefault();const next=structuredClone(read());for(const [name,f] of Object.entries(next))for(const key of Object.keys(f))f[key]=Number(document.getElementById('feature-'+name+'-'+key).value)/100;try{change(next);sync();}catch(error){showError(error);}};
 sync();return {sync};
}
