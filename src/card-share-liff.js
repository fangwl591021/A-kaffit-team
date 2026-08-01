const safeJson = (value) => JSON.stringify(value).replace(/</g, "\\u003c");

export function personalCardShareLiffHtml({ liffId, origin, cardId }) {
  const publicCardUrl = `${origin}/c/${encodeURIComponent(cardId)}`;
  const pickerUrl = `https://liff.line.me/${encodeURIComponent(liffId)}/r/card-share?shareCardId=${encodeURIComponent(cardId)}&share=1`;
  return new Response(`<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>分享電子名片</title><script src="https://static.line-scdn.net/liff/edge/2/sdk.js"></script>
<style>*{box-sizing:border-box}html,body{margin:0;min-height:100%;background:#fff8f3;color:#3d2920;font-family:system-ui,"Noto Sans TC",sans-serif}.page{min-height:100svh;display:grid;place-items:center;padding:24px}.card{width:min(100%,420px);padding:28px 22px;border:1px solid #edcdbd;border-radius:24px;background:#fff;text-align:center;box-shadow:0 8px 24px rgba(113,48,21,.08)}.mark{width:54px;height:54px;margin:0 auto 14px;border-radius:50%;display:grid;place-items:center;background:#f9e9df;color:#b95121;font-size:26px;font-weight:800}h1{font-size:24px;margin:0 0 10px}p{margin:0;color:#765b4e;line-height:1.65;white-space:pre-wrap}.actions{display:grid;gap:10px;margin-top:20px}.button{min-height:46px;border:0;border-radius:14px;display:grid;place-items:center;padding:10px 16px;background:#b95121;color:#fff;text-decoration:none;font-weight:800}.button.alt{background:#f9e9df;color:#b95121}.detail{margin-top:14px;font-size:12px;color:#9b7c6e;word-break:break-word}</style></head>
<body><main class="page"><section class="card"><div class="mark" id="mark">A</div><h1 id="title">正在開啟分享通訊錄</h1><p id="message">請稍候，不需要重新登入會員中心。</p><div class="actions"><a id="fallback" class="button alt" hidden>改用 LINE 一般分享</a></div><div id="detail" class="detail"></div></section></main>
<script>
const LIFF_ID=${safeJson(liffId)};
const CARD_ID=${safeJson(cardId)};
const API_ORIGIN=${safeJson(origin)};
const PUBLIC_CARD_URL=${safeJson(publicCardUrl)};
const PICKER_URL=${safeJson(pickerUrl)};
const title=document.querySelector("#title");
const message=document.querySelector("#message");
const detail=document.querySelector("#detail");
const mark=document.querySelector("#mark");
const fallback=document.querySelector("#fallback");
const clean=(value,max=300)=>String(value||"").trim().slice(0,max);
const validUri=(value)=>/^(?:https?:|tel:|mailto:|line:)/i.test(clean(value,2048))?clean(value,2048):"";
const show=(heading,text,error="")=>{title.textContent=heading;message.textContent=text||"";detail.textContent=error||"";};
const enableFallback=(name="A-KAFFIT TEAM 會員")=>{fallback.hidden=false;fallback.href="https://line.me/R/share?text="+encodeURIComponent("電子名片｜"+name+"\\n"+PUBLIC_CARD_URL);};
const button=(label,uri,color="#B95121")=>({type:"button",style:"primary",height:"sm",color,action:{type:"uri",label:clean(label,20),uri}});
const flexFor=(card)=>{
  const displayName=clean(card.displayName,80)||"A-KAFFIT TEAM 會員";
  const meta=[clean(card.companyName,120),[clean(card.jobTitle,80),clean(card.department,80)].filter(Boolean).join("｜")].filter(Boolean).join("\\n");
  const contents=[{type:"text",text:displayName,weight:"bold",size:"xl",color:"#3D2920",align:"center",wrap:true}];
  if(card.englishName)contents.push({type:"text",text:clean(card.englishName,80),size:"sm",color:"#857581",margin:"sm",align:"center",wrap:true});
  if(meta)contents.push({type:"text",text:meta,size:"sm",color:"#5E5260",align:"center",wrap:true,margin:"md",maxLines:3});
  if(card.serviceDescription)contents.push({type:"text",text:clean(card.serviceDescription,500),size:"sm",color:"#5E5260",wrap:true,margin:"md",maxLines:4});
  const actions=[{label:"查看完整名片",value:PUBLIC_CARD_URL,color:"#B95121"},...(Array.isArray(card.buttons)?card.buttons:[])].filter(item=>item&&item.enabled!==false&&clean(item.label,20)&&validUri(item.value)).slice(0,4);
  const cover=/^https:\\/\\//i.test(clean(card.coverUrl,2048))?clean(card.coverUrl,2048):"";
  return {type:"bubble",size:"mega",...(cover?{hero:{type:"image",url:cover,size:"full",aspectRatio:"20:13",aspectMode:"cover",action:{type:"uri",uri:PUBLIC_CARD_URL}}}:{}),header:{type:"box",layout:"horizontal",justifyContent:"flex-end",paddingAll:"8px",contents:[{type:"box",layout:"vertical",justifyContent:"center",backgroundColor:"#B95121",width:"65px",height:"25px",cornerRadius:"25px",contents:[{type:"text",text:"分享",weight:"bold",align:"center",color:"#FFFFFF",size:"xs"}],action:{type:"uri",uri:PICKER_URL}}]},body:{type:"box",layout:"vertical",paddingAll:"18px",contents},footer:{type:"box",layout:"vertical",spacing:"sm",contents:actions.map(item=>button(item.label,validUri(item.value),item.color||"#B95121"))}};
};
const cleanRedirect=()=>{const url=new URL(location.href);["code","state","scope","error","error_description","liff.state","liff.referrer"].forEach(key=>url.searchParams.delete(key));url.searchParams.set("shareCardId",CARD_ID);url.searchParams.set("share","1");return url.toString();};
(async()=>{
  try{
    await liff.init({liffId:LIFF_ID});
    if(!liff.isLoggedIn()){liff.login({redirectUri:cleanRedirect()});return;}
    if(!liff.isApiAvailable("shareTargetPicker"))throw Object.assign(new Error("此環境未提供分享通訊錄"),{code:"SHARE_TARGET_PICKER_UNAVAILABLE"});
    const response=await fetch(API_ORIGIN+"/v1/cards/"+encodeURIComponent(CARD_ID)+"/public",{headers:{accept:"application/json"}});
    const payload=await response.json().catch(()=>({}));
    if(!response.ok||!payload.card)throw new Error(payload.error||"名片不存在或尚未公開");
    const name=clean(payload.card.displayName,80)||"A-KAFFIT TEAM 會員";
    mark.textContent=name.slice(0,1)||"A";
    enableFallback(name);
    const result=await liff.shareTargetPicker([{type:"flex",altText:"電子名片｜"+name,contents:flexFor(payload.card)}]);
    if(result===false){show("已取消分享","你尚未選擇分享對象，可以再次開啟分享。");return;}
    fallback.hidden=true;show("名片已分享","已成功傳送到你選擇的 LINE 好友或群組。");
    setTimeout(()=>{try{if(liff.isInClient())liff.closeWindow();}catch{}},900);
  }catch(error){
    const code=clean(error&&error.code,80);const reason=clean(error&&error.message,300)||"未知錯誤";
    enableFallback();show("名片分享失敗","請使用下方一般分享，或將錯誤內容截圖回報。",(code?code+"｜":"")+reason);
  }
})();
</script></body></html>`, { headers: { "content-type":"text/html; charset=utf-8", "cache-control":"no-store" } });
}
