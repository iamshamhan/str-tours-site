import test from "node:test";
import assert from "node:assert/strict";
import { tourEditorSchema,emptyTour,slugify,entitySchemas,entityConfig,sectionsSchema,inquirySchema,isEntity } from "../src/lib/editor/schema.ts";
const id="123e4567-e89b-42d3-a456-426614174000", day="223e4567-e89b-42d3-a456-426614174000";
const valid=()=>({tour:{...emptyTour,id,title:"Island tour",slug:"island-tour"},days:[{id:day,title:"Arrival",description:"",locations:"",travel_time:"",photos:[]}],deleted:[]});
test("tour validation preserves draft zero price and rejects invalid price, slug and media",()=>{
  const v=valid();v.tour.price_from=0;assert.equal(tourEditorSchema.safeParse(v).success,true);
  for(const patch of [{price_from:-1},{slug:"Bad Slug"},{duration_days:0},{gallery:["bad"]}])assert.equal(tourEditorSchema.safeParse({...v,tour:{...v.tour,...patch}}).success,false);
  assert.equal(slugify("Kandy & Ella — 7 days"),"kandy-ella-7-days");
});
test("itinerary rejects duplicate IDs, deleted live days and excess days",()=>{
  const v=valid();assert.equal(tourEditorSchema.safeParse({...v,days:[...v.days,...v.days]}).success,false);
  assert.equal(tourEditorSchema.safeParse({...v,deleted:[day]}).success,false);
});
test("route stops must belong to an included day and cannot duplicate IDs",()=>{
  const v=valid(),stop={id,place_id:id,itinerary_day_id:day,label:"Stop",description:"",travel_mode:"road"};
  assert.equal(tourEditorSchema.safeParse({...v,stops:[stop]}).success,true);
  assert.equal(tourEditorSchema.safeParse({...v,stops:[{...stop,itinerary_day_id:id}]}).success,false);
  assert.equal(tourEditorSchema.safeParse({...v,stops:[stop,stop]}).success,false);
});
test("entity editors reject unknown tables, bad coordinates and out-of-range review ratings",()=>{
  assert.equal(isEntity("admin_users"),false);assert.equal(isEntity("__proto__"),false);
  const common={id,slug:"test",published:false,updated_at:null};
  assert.equal(entitySchemas.places.safeParse({...entityConfig.places.defaults,...common,name:"Place",latitude:91}).success,false);
  assert.equal(entitySchemas.reviews.safeParse({...entityConfig.reviews.defaults,...common,author_name:"Guest",body:"Review",rating:6}).success,false);
});
test("page links and inquiry updates validate security-sensitive fields",()=>{
  const section={id,type:"cta",published:false,content:{cta_href:"javascript:alert(1)"}};
  assert.equal(sectionsSchema.safeParse([section]).success,false);
  assert.equal(sectionsSchema.safeParse([{...section,content:{cta_href:"/tours"}}]).success,true);
  assert.equal(inquirySchema.safeParse({id,updated_at:"2026-10-19T00:00:00Z",status:"booked",notes:"Private"}).success,true);
  assert.equal(inquirySchema.safeParse({id,updated_at:"now",status:"public",notes:""}).success,false);
});
test("new home sections validate destination references, collection limits and step content",()=>{
  let sequence=0;const section=(type,content)=>({id:`123e4567-e89b-42d3-a456-${String(++sequence).padStart(12,"0")}`,type,published:true,content});
  assert.equal(sectionsSchema.safeParse([section("search_bar",{}),section("stats",{items:[{title:"6",body:"Journeys"}]}),section("how_it_works",{items:[{title:"Explore",body:"Choose a route"}]}),section("destinations",{place_ids:[id],limit:5})]).success,true);
  for(const content of [{place_ids:["invalid"]},{limit:999}])assert.equal(sectionsSchema.safeParse([section("destinations",content)]).success,false);
  assert.equal(sectionsSchema.safeParse([section("how_it_works",{items:[{title:"Explore",body:42}]})]).success,false);
});
