// Acquired public ArcSite viewer behavior; see viewport-code-observation.json.
// The source has no scale clamp. Fit resets both scale and translation.
export class ObservedViewport {
 constructor(){this.scale=1;this.x=0;this.y=0}
 fit(width,height,imageWidth,imageHeight){
  if(!(width>0&&height>0&&imageWidth>0&&imageHeight>0))return false;
  this.scale=Math.min(width/imageWidth,height/imageHeight);
  this.x=(width-imageWidth*this.scale)/2;
  this.y=(height-imageHeight*this.scale)/2;
  return true;
 }
 zoom(factor,anchorX,anchorY){
  this.x=anchorX+(this.x-anchorX)*factor;
  this.y=anchorY+(this.y-anchorY)*factor;
  this.scale*=factor;
 }
 drag(dx,dy){this.x+=dx;this.y+=dy}
 css(){return `translate(${this.x}px,${this.y}px) scale(${this.scale})`}
}

export function attachObservedViewport(viewport,image,controls){
 const state=new ObservedViewport();let loaded=false,previous=null;
 const draw=()=>{image.style.transform=state.css()};
 const fit=()=>{if(state.fit(viewport.clientWidth,550,image.naturalWidth,image.naturalHeight)){loaded=true;draw()}};
 image.addEventListener('load',fit);
 const zoom=factor=>{if(loaded){state.zoom(factor,viewport.clientWidth/2,550/2);draw()}};
 controls.in.addEventListener('click',()=>zoom(1/.75));
 controls.out.addEventListener('click',()=>zoom(.75));
 controls.fit.addEventListener('click',fit);
 viewport.addEventListener('wheel',event=>{
  if(!loaded)return;
  const bounds=viewport.getBoundingClientRect();
  state.zoom(event.deltaY<0?1/.95:.95,event.clientX-bounds.left,event.clientY-bounds.top);
  draw();event.preventDefault();
 },{passive:false});
 const move=event=>{state.drag(event.pageX-previous.x,event.pageY-previous.y);previous={x:event.pageX,y:event.pageY};draw()};
 const stop=()=>{previous=null;document.body.removeEventListener('mousemove',move);document.body.removeEventListener('mouseup',stop);viewport.classList.remove('dragging')};
 viewport.addEventListener('mousedown',event=>{
  if(!loaded||event.target.closest('button'))return;
  event.preventDefault();previous={x:event.pageX,y:event.pageY};viewport.classList.add('dragging');
  document.body.addEventListener('mousemove',move);document.body.addEventListener('mouseup',stop);
 });
 // Refresh loads the observed fit state again; no invented touch gestures.
 return {fit,clear:()=>{loaded=false;stop()}};
}
