import {bindRepeatButton} from './repeat-button.js';

// One control for editable numeric values, including fields added by panels later.
export class NumericField {
 constructor(input){
  this.input=input;
  const outer=input.closest('#axis-rotation-row > div, #axis-value-row > div, #distance-form label > div');
  const row=outer || (input.parentElement?.matches('label div') && input.parentElement.children.length<=2 ? input.parentElement : null);
  const host=row || document.createElement('div');
  if(!row){input.before(host);host.append(input);}
  host.classList.add('numeric-field');
  const oldValue=input.parentElement.matches('.axis-rotation-value')?input.parentElement:null;
  const value=oldValue || document.createElement('span');
  value.classList.add('numeric-field-value');
  if(!oldValue){input.before(value);value.append(input);}
  let unit=oldValue?.querySelector('span') || [...host.children].find(node=>node.tagName==='SPAN'&&node!==value);
  if(!unit&&input.id.startsWith('edit-')){unit=document.createElement('span');unit.textContent=input.id.startsWith('edit-r-')?'°':'cm';}
  if(unit){unit.classList.add('numeric-field-unit');value.append(unit);}
  const existing=[...host.children].filter(node=>node.tagName==='BUTTON');
  if(existing.length===2){host.prepend(existing[0]);host.append(existing[1]);return;}
  const label=input.getAttribute('aria-label') || input.closest('label')?.textContent.trim() || 'wartość';
  const button=(sign)=>{const element=document.createElement('button');element.type='button';element.className='numeric-field-step';element.textContent=sign<0?'‹':'›';element.setAttribute('aria-label',(sign<0?'Zmniejsz ':'Zwiększ ')+label);bindRepeatButton(element,()=>this.step(sign));return element;};
  host.prepend(button(-1));host.append(button(1));
 }
 step(sign){
  const input=this.input;if(input.disabled||input.readOnly)return;
  const percentage=input.value.trim().endsWith('%');
  const raw=input.value.trim().replace(',','.').replace(/%$/,'');
  const current=Number(raw),attribute=Number(input.getAttribute('step'));
  const increment=percentage?1:input.id==='axis-rotation'?1:Number.isFinite(attribute)&&attribute>0?attribute:0.1;
  const min=input.hasAttribute('min')?Number(input.min):-Infinity,max=input.hasAttribute('max')?Number(input.max):Infinity;
  const next=Math.min(max,Math.max(min,(Number.isFinite(current)?current:0)+sign*increment));
  const precision=(String(increment).split('.')[1]||'').length;
  input.value=Number(next.toFixed(Math.max(precision,2))).toString()+(percentage?'%':'');
  input.dispatchEvent(new Event('input',{bubbles:true}));
  input.dispatchEvent(new Event('change',{bubbles:true}));
 }
}

export function setupNumericFields(){
 const fields=new WeakSet();
 const enhance=()=>{for(const input of document.querySelectorAll('input[type="number"], #axis-rotation, #axis-distance, #edge-insert-value'))if(!fields.has(input)){fields.add(input);new NumericField(input);}};
 enhance();
 new MutationObserver(enhance).observe(document.body,{childList:true,subtree:true});
}
