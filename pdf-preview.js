import {getDocument,GlobalWorkerOptions} from './vendor/pdf.mjs';
GlobalWorkerOptions.workerSrc=new URL('./vendor/pdf.worker.mjs',import.meta.url).href;

// Acquired source viewer renders page one, then re-renders its PDF at each
// observed viewport transform. Keep a single active canvas render task.
export class PDFPreview {
 constructor(canvas,viewport){this.canvas=canvas;this.viewport=viewport;this.size={width:0,height:0};this.generation=0;this.serial=0}
 async load(bytes){
  this.clear();const generation=this.generation;
  const loading=getDocument({data:new Uint8Array(bytes),isEvalSupported:false});this.loading=loading;
  const document=await loading.promise;
  if(generation!==this.generation){await document.destroy();return false}
  const page=await document.getPage(1);
  if(generation!==this.generation)return false;
  this.document=document;this.page=page;
  const bounds=page.getViewport({scale:1});this.size={width:bounds.width,height:bounds.height};
  this.onLoad?.();return true;
 }
 render(state){
  this.pending={scale:state.scale,x:state.x,y:state.y};this.task?.cancel();
  if(this.loop)return;
  this.loop=this.drain().catch(error=>{if(error.name!=='RenderingCancelledException')this.onError?.(error)}).finally(()=>{
   this.loop=null;if(this.pending&&this.page)this.render(this.pending);
  });
 }
 async drain(){
  while(this.pending&&this.page){
   const state=this.pending;this.pending=null;const page=this.page,generation=this.generation;
   const width=this.viewport.clientWidth,ratio=window.devicePixelRatio||1;
   if(!(width>0))return;
   const canvas=this.canvas;canvas.width=Math.ceil(width*ratio);canvas.height=Math.ceil(550*ratio);
   const task=page.render({canvasContext:canvas.getContext('2d'),viewport:page.getViewport({scale:1}),
    transform:[state.scale*ratio,0,0,state.scale*ratio,state.x*ratio,state.y*ratio],background:'#fff'});this.task=task;
   try{await task.promise}catch(error){if(error.name==='RenderingCancelledException')continue;throw error}
   if(generation!==this.generation)return;
   this.task=null;Object.assign(canvas.dataset,{scale:String(state.scale),x:String(state.x),y:String(state.y),renderSerial:String(++this.serial)});
  }
 }
 clear(){
  this.generation++;this.pending=null;this.page=null;this.task?.cancel();this.task=null;
  this.loading?.destroy().catch(()=>{});this.loading=null;this.document=null;this.size={width:0,height:0};
  this.canvas.width=0;this.canvas.height=0;
  for(const key of ['scale','x','y','renderSerial'])delete this.canvas.dataset[key];
 }
}
