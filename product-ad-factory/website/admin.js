const $=(selector)=>document.querySelector(selector);
const notice=$('#admin-notice');
let adminKey='',selected=null;
const message=(text,error=false)=>{notice.textContent=text;notice.className=error?'message error':'message ok';};
async function call(path,options={}){
  if(!adminKey)throw new Error('Enter admin key');
  const response=await fetch(path,{...options,headers:{...(options.headers||{}),'x-admin-key':adminKey,'Accept':'application/json'}});
  const body=await response.json().catch(()=>({error:'Invalid response'}));
  if(!response.ok) throw new Error(body.error||'Request failed');
  return body;
}
async function reload(){
  const payload=await call('/api/admin/orders');
  const target=$('#orders-list');
  target.replaceChildren();
  const heading=document.createElement('h2');heading.textContent='Orders ('+payload.orders.length+')';target.append(heading);
  for(const order of payload.orders){
    const row=document.createElement('div');row.className='order-row';
    const details=document.createElement('div');
    const title=document.createElement('strong');title.textContent=order.brand_name+' · '+order.title;
    const meta=document.createElement('small');meta.textContent=order.id+' · '+order.status+' · AED '+order.quoted_aed;
    details.append(title,meta);
    const button=document.createElement('button');button.className='small-btn';button.textContent='Review ↗';
    button.addEventListener('click',()=>selectOrder(order.id));
    row.append(details,button);target.append(row);
  }
}
async function selectOrder(id){
  selected=await call('/api/admin/orders/'+encodeURIComponent(id));
  $('#order-editor').hidden=false;
  const info=$('#selected-info');
  info.replaceChildren();
  for(const [label,value] of [
    ['Order',selected.id],['Status',selected.status],['Contact',selected.client_name+' / '+selected.client_email],
    ['Store URL',selected.product_url],['Package','AED '+selected.quoted_aed+' · '+selected.package_key],
    ['Rights assertion',selected.rights_note],['Uploaded image',selected.image_path?'Yes — file stored privately':'No'],
  ]){
    const p=document.createElement('p');p.textContent=label+': '+value;info.append(p);
  }
  $('#approved-title').value=selected.approved_title||selected.title;
  $('#approved-image').value=selected.approved_image_url||selected.candidate_image_url||'';
  $('#approved-claims').value=(selected.approvedClaims?.length?selected.approvedClaims:selected.claims).join('\n');
  $('#review-evidence').value=selected.rights_note||'';
  $('#claim-check').checked=false;$('#rights-check').checked=false;
  $('#order-editor').scrollIntoView({behavior:'smooth'});
  message('Loaded order '+selected.id+'. Approvals are not automatic.');
}
$('#load-orders').addEventListener('click',async()=>{
  adminKey=$('#admin-key').value;
  try{await reload();message('Orders loaded.');}catch(error){message(error.message,true);}
});
$('#approve-order').addEventListener('click',async()=>{
  if(!selected)return;
  try{
    const payload={
      title:$('#approved-title').value.trim(),
      imageUrl:$('#approved-image').value.trim(),
      claims:$('#approved-claims').value.split('\n').map(s=>s.trim()).filter(Boolean).slice(0,3),
      rightsNote:$('#review-evidence').value.trim(),
      claimsChecked:$('#claim-check').checked,
      rightsChecked:$('#rights-check').checked,
    };
    const result=await call('/api/admin/orders/'+selected.id+'/approve',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    message('Approved. You may now dispatch a render job.');
    await selectOrder(selected.id); await reload();
  }catch(error){message(error.message,true);}
});
$('#dispatch-order').addEventListener('click',async()=>{
  if(!selected)return;
  try{
    const result=await call('/api/admin/orders/'+selected.id+'/dispatch',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
    message('GitHub Actions dispatched for order '+result.orderId+'. Check back for completion.');
    await selectOrder(selected.id);await reload();
  }catch(error){message(error.message,true);}
});
$('#deliver-order').addEventListener('click',async()=>{
  if(!selected)return;
  try{
    if(!confirm('Confirm you independently verified the customer payment and the video is acceptable?'))return;
    const result=await call('/api/admin/orders/'+selected.id+'/deliver',{method:'POST',
      headers:{'Content-Type':'application/json'},body:JSON.stringify({paymentReference:$('#payment-ref').value})});
    message('Customer video released after verified payment reference '+result.paymentReference);
    await selectOrder(selected.id);await reload();
  }catch(error){message(error.message,true);}
});
