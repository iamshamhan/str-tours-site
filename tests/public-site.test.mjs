import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync,existsSync } from "node:fs";
import { resolve,dirname } from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";
import React from "react";
import vm from "node:vm";
import { renderToStaticMarkup } from "react-dom/server";
import { tripSchema,reviewSubmissionSchema } from "../src/lib/public/submission-schema.ts";
import { filterTours,distanceKm } from "../src/lib/public/filters.ts";
import { contentSchemas } from "../src/lib/public/types.ts";
import { contrastRatio,emptySettings,settingsSchema } from "../src/lib/settings/schema.ts";

function sourceModule(path,mocks={},modules=new Map()){
  const file=resolve(path);if(modules.has(file))return modules.get(file).exports;
  const record={exports:{}};modules.set(file,record);
  const js=ts.transpileModule(readFileSync(file,"utf8"),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  const native=createRequire(file),require=(name)=>{
    if(Object.hasOwn(mocks,name))return mocks[name];if(name==="server-only")return {};
    if(name.startsWith("@/")||name.startsWith(".")){const base=name.startsWith("@/")?resolve("src",name.slice(2)):resolve(dirname(file),name);const target=[base,base+".ts",base+".tsx",base+".mjs"].find(existsSync);if(target)return sourceModule(target,mocks,modules);}
    return native(name);
  };
  new Function("require","module","exports",js)(require,record,record.exports);return record.exports;
}
const id="123e4567-e89b-42d3-a456-426614174000";
const trip=()=>({name:"Test visitor",email:"visitor@example.invalid",country:"Test",whatsapp:"",startDate:"2099-06-01",endDate:"2099-06-08",travellers:2,interests:"Rail",budget:"USD 2000",message:"A private test inquiry",consent:true,tourId:null,website:"",startedAt:Date.now()-3000});
test("trip and review validation reject missing consent, bad ranges and forged fields",()=>{
  assert.equal(tripSchema.safeParse(trip()).success,true);
  for(const patch of [{consent:false},{endDate:"2099-05-01"},{travellers:0},{email:"invalid"}])assert.equal(tripSchema.safeParse({...trip(),...patch}).success,false);
  const result=tripSchema.parse({...trip(),status:"booked",notes:"expose"});assert.equal("notes" in result,false);assert.equal("status" in result,false);
  assert.equal(reviewSubmissionSchema.safeParse({name:"Test",country:"",rating:6,message:"Test review body",date:"",consent:true,tourId:null,website:"",startedAt:Date.now()}).success,false);
});
test("anonymous submission actions do not return rows, allow internal fields or bypass review settings",async()=>{
  const inserts=[],outgoing=[];let enabled=false;
  const actions=sourceModule("src/app/(public)/actions.ts",{
    "next/headers":{headers:async()=>new Headers({"x-forwarded-for":"192.0.2.1"})},"next/server":{after:()=>{}},
    "@/lib/settings/public":{getPublicSettings:async()=>({inquiriesEnabled:true,publicReviews:enabled})},
    "@/lib/public/notify":{notifyOwner:async()=>{}},"@/lib/public/submission-limit":{allowSubmission:()=>true},
    "@/lib/supabase/public":{createPublicClient:(headers)=>{outgoing.push(headers);return {from:table=>({insert:async payload=>{inserts.push({table,payload});return {error:null};}})};}}
  });
  assert.equal((await actions.submitTrip({...trip(),notes:"private",status:"booked"})).status,"success");
  assert.equal(inserts[0].payload.consent,true);assert.equal("notes" in inserts[0].payload,false);assert.equal("status" in inserts[0].payload,false);
  assert.match(outgoing[0]["x-submission-key"],/^[a-f0-9]{64}$/);assert.equal(JSON.stringify(outgoing).includes("192.0.2.1"),false);
  assert.equal((await actions.submitTrip({...trip(),website:"bot"})).status,"success");assert.equal(inserts.length,1);
  const review={name:"Test",country:"",rating:5,message:"A review for validation",date:"",tourId:null,consent:true,website:"",startedAt:Date.now()-3000};
  assert.equal((await actions.submitPublicReview(review)).status,"error");assert.equal(inserts.length,1);
  enabled=true;assert.equal((await actions.submitPublicReview({...review,status:"approved",published:true})).status,"success");
  assert.equal("published" in inserts[1].payload,false);assert.equal("status" in inserts[1].payload,false);
});
test("public reads reject drafts even if a data response accidentally contains them",async()=>{
  const rows=[{id,slug:"one",title:"Published",published:true,updated_at:"2026-10-19",seo:{}},{id:"223e4567-e89b-42d3-a456-426614174000",slug:"two",title:"Secret draft",published:false,updated_at:"2026-10-19",seo:{}}],filters=[];
  const content=sourceModule("src/lib/public/content.ts",{"@/lib/settings/public":{getPublicSettings:async()=>({published:true})},"@/lib/supabase/public":{createPublicClient:()=>({from:()=>{const q={select:()=>q,eq:(key,value)=>{filters.push([key,value]);return q;},order:()=>q,range:async()=>({data:rows,error:null})};return q;}})}});
  const publicRows=await content.readPublished("pages");assert.equal(publicRows.length,1);assert.equal(publicRows[0].title,"Published");assert.deepEqual(filters[0],["published",true]);
  assert.equal(contentSchemas.reviews.safeParse({...rows[0],status:"pending"}).success,false);
});
test("tour filters combine duration, tags, route region and month; distances are approximate",()=>{
  const c={tours:[{id,title:"Rail journey",summary:"Mountains",duration_days:7,tags:["rail"],regions:[],best_months:["May"]}],places:[{id:"place",region:"Hills"}],stops:[{tour_id:id,place_id:"place"}],days:[],media:[]};
  assert.equal(filterTours(c,{q:"mountain",duration:"7",tag:"rail",region:"Hills",month:"May"}).length,1);
  assert.equal(filterTours(c,{duration:"3"}).length,0);
  assert.equal(distanceKm([{latitude:0,longitude:0},{latitude:0,longitude:1}]),111);
});
test("public images use database alt text, responsive sizes and hide assets without alt text",()=>{
  const content=sourceModule("src/lib/public/content.ts",{"@/lib/settings/public":{getPublicSettings:async()=>null}});
  const Photo=sourceModule("src/components/public/photo.tsx",{"@/lib/public/content":content,"next/image":({src,alt,sizes})=>React.createElement("img",{src,alt,sizes})}).Photo;
  const media=[{id,mime_type:"image/webp",alt_text:"Coastline <script>",storage_path:`${id}.webp`}];
  const html=renderToStaticMarkup(React.createElement(Photo,{id,media}));assert.match(html,/alt="Coastline &lt;script&gt;"/);assert.match(html,/sizes=/);
  assert.equal(renderToStaticMarkup(React.createElement(Photo,{id,media:[{...media[0],alt_text:""}]})),"");
});
test("published themes enforce readable text contrast",()=>{
  assert.equal(contrastRatio("#FFFFFF","#000000"),21);
  assert.equal(settingsSchema.safeParse({...emptySettings,businessName:"Test",published:true,textColor:"#EEEEEE"}).success,false);
});

test("both palettes validate button, card and muted-text contrast",()=>{
 const good={...emptySettings,published:true,businessName:"Test",accent:"#0B655F",background:"#FAFCFA",textColor:"#142E31"};
 assert.equal(settingsSchema.safeParse(good).success,true);
 for(const patch of [{darkText:good.darkBackground},{darkAccentText:good.darkAccent},{secondaryText:good.secondary},{muted:good.surface}])assert.equal(settingsSchema.safeParse({...good,...patch}).success,false);
 assert.equal(settingsSchema.safeParse({...good,navCtaHref:"javascript:alert(1)"}).success,false);
});
test("pre-paint theme resolves saved, system, invalid and unavailable storage",()=>{
 const {themeScript}=sourceModule("src/lib/settings/theme.ts");
 for(const [saved,dark,expected,blocked] of [["light",true,"light",false],["dark",false,"dark",false],[null,true,"dark",false],["invalid",false,"light",false],[null,true,"dark",true]]){
  const root={dataset:{}};
  vm.runInNewContext(themeScript,{document:{documentElement:root},matchMedia:()=>({matches:dark}),localStorage:{getItem:()=>{if(blocked)throw Error("denied");return saved;}}});
  assert.equal(root.dataset.theme,expected);
  assert.equal(root.dataset.preference,["light","dark","system"].includes(saved)?saved:"system");
 }
});
