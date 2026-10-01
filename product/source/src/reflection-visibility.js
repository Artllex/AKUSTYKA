export function updateReflectionVisibility(view,projection,withObjects,visibleObjectIds=new Set()){
 if(!view)return;
 for(const child of view.group.children){
  child.visible=projection
   ? !!(withObjects&&child.name==='reflection-projection'&&(child.userData.surface===projection.surfaceName||visibleObjectIds.has(child.userData.objectId)))
   : child.name!=='reflection-projection';
 }
}
