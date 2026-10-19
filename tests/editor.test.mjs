import test from "node:test";
import assert from "node:assert/strict";
import { tourEditorSchema,emptyTour,slugify } from "../src/lib/editor/schema.ts";
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
