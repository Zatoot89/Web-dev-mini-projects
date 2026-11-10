const $=(s)=>document.querySelector(s);
const form=$('#order-form');
const submitResult=$('#submit-result');
const previewResult=$('#preview-result');
const statusResult=$('#status-result');
const notice=(el,message,isError=false)=>{el.textContent=message;el.className=isError?'message error':'message ok';};
async function api(url,opts={}){
  const res=await fetch(url,{...opts,headers:{...(opts.headers||{}),'Accept':'application/json'}});
  const body=await res.json().catch(()=>({error:'Unexpected response'}));
  if(!res.ok)throw new Error(body.error||'The request failed');
  return body;
}
$('#preview-btn').addEventListener('click',async()=>{
  const url=$('#product-url').value.trim();
  if (!url) return notice(previewResult,'Enter a product URL first.',true);
  $('#preview-btn').disabled=true;
  notice(previewResult,'Inspecting the product listing…');
  try{
    const p=await api('/api/preview',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({productUrl:url})});
    if(p.title) $('#product-title').value=p.title;
    if(p.candidateImageUrl) $('#image-url').value=p.candidateImageUrl;
    notice(previewResult,'Found listing metadata. Please verify all wording and image rights before submitting; no claims are auto-approved.');
  }catch(e){notice(previewResult,e.message+' You can continue with manual details.',true);}
  finally{$('#preview-btn').disabled=false;}
});
form.addEventListener('submit',async(e)=>{
  e.preventDefault();
  const b=$('#submit-order');b.disabled=true;
  const fields=new FormData(form);
  const file=$('#product-image').files[0];
  if(file && (file.size>6_000_000 || !['image/jpeg','image/png','image/webp'].includes(file.type))){
    notice(submitResult,'Please choose a valid JPEG, PNG or WebP under 6 MB.',true);b.disabled=false;return;
  }
  const payload={
    clientName:String(fields.get('clientName')||'').trim(),
    clientEmail:String(fields.get('clientEmail')||'').trim(),
    brandName:String(fields.get('brandName')||'').trim(),
    productUrl:String(fields.get('productUrl')||'').trim(),
    title:String(fields.get('title')||'').trim(),
    imageUrl:String(fields.get('imageUrl')||'').trim(),
    claims:[fields.get('claim1'),fields.get('claim2'),fields.get('claim3')].map(s=>String(s||'').trim()).filter(Boolean),
    language:String(fields.get('language')||'en'),
    color:String(fields.get('color')||'#3C82F6'),
    packageKey:'single',extraLanguage:false,
    rightsConfirmed:$('#rights-confirmed').checked,
    rightsNote:String(fields.get('rightsNote')||'').trim(),
    termsAccepted:$('#terms').checked,
  };
  notice(submitResult,'Submitting your request…');
  try{
    const receipt=await api('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    sessionStorage.setItem('factoryReceipt',JSON.stringify({id:receipt.orderId,token:receipt.trackingToken}));
    let uploadText='';
    if(file){
      try{
        const uploaded=await fetch('/api/orders/'+encodeURIComponent(receipt.orderId)+'/asset',
          {method:'POST',headers:{'x-tracking-token':receipt.trackingToken,'Content-Type':file.type},body:file});
        if(!uploaded.ok)throw new Error((await uploaded.json()).error||'Image upload failed');
        uploadText=' Your image was uploaded for rights review.';
      }catch(error){uploadText=' The request was saved but image upload failed: '+error.message+'. Contact support with the order code.';}
    }
    notice(submitResult,'Order '+receipt.orderId+' received. Quote: AED '+receipt.quote.amountAed+'.'+uploadText+' Save your order code. No payment has been taken.');
    form.reset();
  }catch(error){notice(submitResult,error.message,true);}
  finally{b.disabled=false;}
});
$('#check-status').addEventListener('click',async()=>{
  const saved=sessionStorage.getItem('factoryReceipt');
  if(!saved)return notice(statusResult,'No order receipt in this browser session. Keep your order ID and tracking key safe.',true);
  try{
    const {id,token}=JSON.parse(saved);
    const order=await api('/api/orders/'+encodeURIComponent(id),{headers:{'x-tracking-token':token}});
    const labels={pending_review:'Under human review',approved:'Approved for production',
      rendering:'Rendering in progress',ready:'Video ready — awaiting payment confirmation',
      delivered:'Delivered',rejected:'Needs a new approved submission',failed:'Render needs attention'};
    notice(statusResult,'Order '+id+' · '+(labels[order.status]||order.status)+' · AED '+order.quotedAed);
    if(order.videoReady){
      const resp=await fetch('/api/orders/'+encodeURIComponent(id)+'/video',{headers:{'x-tracking-token':token}});
      if(resp.ok){const blob=await resp.blob();const link=document.createElement('a');
        link.href=URL.createObjectURL(blob);link.download='product-ad.mp4';link.textContent='Download your MP4';
        link.className='video-link';statusResult.append(link);
        link.addEventListener('click',()=>setTimeout(()=>URL.revokeObjectURL(link.href),10000),{once:true});}
    }
  }catch(error){notice(statusResult,error.message,true);}
});
for(const item of document.querySelectorAll('[data-assisted]')){
  item.addEventListener('click',e=>{e.preventDefault();alert('Growth and Scale are concierge-managed pilot plans. Submit a Single Ad request and mention a monthly package in the rights/notes field, or contact the operator for a quote.');});
}
