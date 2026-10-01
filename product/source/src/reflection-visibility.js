export function updateReflectionVisibility(view,projection,withObjects){
 if(!view)return;
 for(const child of view.group.children){
  child.visible=projection
   ? !!(withObjects&&child.name==='reflection-projection'&&child.userData.surface===projection.surfaceName)
   : child.name!=='reflection-projection';
 }
}
