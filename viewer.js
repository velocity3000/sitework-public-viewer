import {attachObservedViewport} from './viewport.js';
const endpoint="https://pmqacyrnuycotoometml.supabase.co/functions/v1/sitework-share";
const token=location.hash.slice(1),byId=id=>document.getElementById(id),labels={png:"PNG",pdf:"PDF",dxf:"AutoCAD® DXF",dwg:"AutoCAD® DWG"};
let revision=null,imageURL=null;
const viewport=attachObservedViewport(byId('viewport'),byId('drawing'),{in:byId('zoom-in'),out:byId('zoom-out'),fit:byId('zoom-fit')});
async function request(action,format){const response=await fetch(endpoint,{method:"POST",headers:{Authorization:"Share "+token,"Content-Type":"application/json"},body:JSON.stringify({action,format}),cache:"no-store"});if(!response.ok){const data=await response.json();throw Error(data.error||"The viewer is temporarily unavailable.")}return response}
function clear(message){viewport.clear();byId("drawing-header").hidden=true;byId("viewport").hidden=true;byId("formats").close();byId("message").textContent=message;byId("message").hidden=false;if(imageURL){URL.revokeObjectURL(imageURL);imageURL=null}byId("drawing").removeAttribute("src");revision=null}
async function refresh(){try{
 if(!/^[a-f0-9]{64}$/.test(token))throw Error("This share link is no longer active.");
 const data=await(await request("metadata")).json();const image=await(await request("preview")).blob();if(imageURL)URL.revokeObjectURL(imageURL);imageURL=URL.createObjectURL(image);byId("drawing").src=imageURL;revision=data.revision;
 byId("name").textContent=data.name;byId("owner").textContent=data.sharedBy?"Shared by "+data.sharedBy:"";byId("drawing-header").hidden=false;byId("viewport").hidden=false;byId("message").hidden=true;byId("download").hidden=!data.allowDownloads;
 byId("format-list").replaceChildren(...data.formats.map(format=>{const button=document.createElement("button");button.textContent=labels[format];button.onclick=()=>download(format);return button}));
}catch(error){clear(error.message)}}
async function download(format){byId("download-error").textContent="";try{const response=await request("download",format),blob=await response.blob(),url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download=byId("name").textContent+"."+format;link.click();setTimeout(()=>URL.revokeObjectURL(url),60000)}catch(error){byId("download-error").textContent=error.message}}
byId("download").onclick=()=>{byId("download-error").textContent="";byId("formats").showModal()};byId("close-formats").onclick=()=>byId("formats").close();document.addEventListener("visibilitychange",()=>{if(!document.hidden)refresh()});refresh();
// Remaining: source PDF rendering, touch behavior and physical comparison.
