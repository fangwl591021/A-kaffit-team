import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { verifyContactCardData } from '../src/card-collection.js';

const row={
  id:'contact_1',scanner_user_id:'user_1',status:'active',display_name:'王小明',english_name:'',company_name:'範例公司',job_title:'',department:'',mobile:'0912345678',company_phone:'',email:'hello@example.com',website_url:'https://example.com/',line_url:'',address:'台北市信義區市府路1號',service_description:'',note:'',versions_json:'{}',selected_version:'standard',chat_alt_text:'',front_r2_key:'',ocr_json:JSON.stringify({displayName:'王小明',companyName:'範例公司',mobile:'0912345678',email:'hello@example.com',websiteUrl:'example.com',address:'台北市信義區市府路1號'}),
};
const dbFor=(value=row)=>({prepare(){return {bind(){return {first:async()=>value}}}}});
const verifiedChecks=['displayName','companyName','mobile','email','websiteUrl','address'].map((field)=>({field,status:'verified',reason:'與原始名片及公開資料一致',evidence:'原始名片 OCR 與公開網站'}));

function providerFor(result,onRequest=()=>{}){
  return {fetch:async(url,init)=>{const body=JSON.parse(init.body);onRequest(body.request);return Response.json({output_text:JSON.stringify(result)})}};
}

test('contact data verification checks every filled public field before saving', async()=>{
  let request;
  const result=await verifyContactCardData(dbFor(),'user_1','contact_1',{},providerFor({passed:true,checks:verifiedChecks,summary:'全部通過'},(value)=>{request=value}),'gpt-test');
  assert.equal(result.passed,true);
  assert.equal(result.checks.length,6);
  assert.deepEqual(request.tools,[{type:'web_search'}]);
  assert.match(request.input[0].content,/台北市信義區市府路1號/);
  assert.doesNotMatch(request.input[0].content,/家庭 Family|生日/);
});

test('contact data verification blocks an unverifiable address', async()=>{
  const checks=verifiedChecks.map((item)=>item.field==='address'?{...item,status:'unverifiable',reason:'找不到地址依據',evidence:''}:item);
  await assert.rejects(()=>verifyContactCardData(dbFor(),'user_1','contact_1',{},providerFor({passed:false,checks,summary:'地址未通過'}),'gpt-test'),/二次查核未通過：地址：找不到地址依據/);
});

test('format failure stops before AI and route verifies before database update', async()=>{
  let called=false;
  await assert.rejects(()=>verifyContactCardData(dbFor(),'user_1','contact_1',{email:'not-an-email'},providerFor({},()=>{called=true}),'gpt-test'),/Email 格式不正確/);
  assert.equal(called,false);
  const source=readFileSync(new URL('../src/index.js',import.meta.url),'utf8');
  assert.ok(source.indexOf('verification=await verifyContactCardData')<source.indexOf('card=await updateContact'));
  const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
  assert.match(app,/查核並儲存/);
  assert.match(app,/二次查核中/);
});