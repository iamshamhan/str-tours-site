import { z } from "zod";
export const slugify=(value:string)=>value.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,150).replace(/-$/g,"");
export const short=z.string().trim().max(300), long=z.string().trim().max(20000), title=short.min(1,"Required"), slug=z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/,"Use lowercase letters, numbers and hyphens").max(180);
export const mediaId=z.uuid().nullable(), photos=z.array(z.uuid()).max(100), lines=z.array(z.string().trim().max(1000)).max(100);
export const seo=z.object({title:z.string().max(160).default(""),description:z.string().max(320).default("")}).passthrough();
export const base={id:z.uuid(),slug,published:z.boolean(),updated_at:z.string().nullable()};
export const daySchema=z.object({id:z.uuid(),title,description:long,locations:short,travel_time:short,photos});
export const routeColour=z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a six-digit hex colour");
export const stopSchema=z.object({id:z.uuid(),place_id:z.uuid(),itinerary_day_id:z.uuid(),label:title,travel_mode:z.enum(["road","rail","walk","boat","safari"]),description:long});
export type Stop=z.infer<typeof stopSchema>;
export type PlaceOption={id:string;name:string;latitude:number;longitude:number};
export const tourSchema=z.object({...base,title,summary:z.string().max(1000),description:long,duration_days:z.number().int().min(1).max(365),duration_nights:z.number().int().min(0).max(365).nullable(),price_from:z.number().min(0).max(9999999999.99).nullable(),cover_media_id:mediaId,gallery:photos,difficulty:short,best_months:lines,tags:lines,highlights:lines,inclusions:lines,exclusions:lines,vehicle_type:short,seo,route_colour:routeColour});
export const tourEditorSchema=z.object({tour:tourSchema,days:z.array(daySchema).max(365),deleted:z.array(z.uuid()).max(365),stops:z.array(stopSchema).max(500).default([]),deletedStops:z.array(z.uuid()).max(500).default([])}).superRefine((v,ctx)=>{
  const ids=v.days.map(d=>d.id);
  if(new Set(ids).size!==ids.length || v.deleted.some(id=>ids.includes(id)))ctx.addIssue({code:"custom",path:["days"],message:"Duplicate or deleted itinerary day."});
  if(v.days.length>v.tour.duration_days)ctx.addIssue({code:"custom",path:["days"],message:"Itinerary exceeds tour duration."});
  if(v.stops.some(s=>!ids.includes(s.itinerary_day_id)))ctx.addIssue({code:"custom",path:["stops"],message:"Assign each stop to an existing itinerary day."});
  if(new Set(v.stops.map(s=>s.id)).size!==v.stops.length || v.stops.some(s=>v.deletedStops.includes(s.id)))ctx.addIssue({code:"custom",path:["stops"],message:"Duplicate or deleted route stop."});
});
export type Tour=z.infer<typeof tourSchema>; export type Day=z.infer<typeof daySchema>;
export const emptyTour:Omit<Tour,"id">={slug:"",published:false,updated_at:null,title:"",summary:"",description:"",duration_days:1,duration_nights:0,price_from:null,cover_media_id:null,gallery:[],difficulty:"",best_months:[],tags:[],highlights:[],inclusions:[],exclusions:[],vehicle_type:"",seo:{title:"",description:""},route_colour:"#476A63"};
export type Field={name:string;label:string;type?:"text"|"long"|"number"|"lines"|"image"|"gallery"|"checkbox"|"select"|"date"|"color";options?:{value:string;label:string}[];nullable?:boolean};
export const tourFields:Field[]=[{name:"title",label:"Title"},{name:"slug",label:"Slug"},{name:"published",label:"Published",type:"checkbox"},{name:"summary",label:"Short description",type:"long"},{name:"description",label:"Long description",type:"long"},{name:"duration_days",label:"Duration (days)",type:"number"},{name:"duration_nights",label:"Nights",type:"number",nullable:true},{name:"price_from",label:"From price (USD)",type:"number",nullable:true},{name:"difficulty",label:"Difficulty"},{name:"best_months",label:"Best months (one per line)",type:"lines"},{name:"tags",label:"Tags (one per line)",type:"lines"},{name:"highlights",label:"Highlights (one per line)",type:"lines"},{name:"inclusions",label:"Inclusions (one per line)",type:"lines"},{name:"exclusions",label:"Exclusions (one per line)",type:"lines"},{name:"vehicle_type",label:"Vehicle type"},{name:"cover_media_id",label:"Cover image",type:"image"},{name:"gallery",label:"Gallery",type:"gallery"},{name:"seo.title",label:"SEO title"},{name:"seo.description",label:"SEO description",type:"long"}];

const https=z.string().max(2048).refine(v=>{if(!v)return true;try{const u=new URL(v);return u.protocol==="https:"&&!u.username&&!u.password&&!/[\u0000-\u0020\\]/.test(v);}catch{return false;}},"Use a full HTTPS URL").nullable();
const date=z.union([z.literal(""),z.iso.date()]).nullable();
const position={latitude:z.number().min(-90).max(90),longitude:z.number().min(-180).max(180)};
export const entitySchemas={
  places:z.object({...base,name:title,description:long,region:short,...position,coordinates_approximate:z.boolean(),cover_media_id:mediaId,photos,best_time:short,tips:long,seo}),
  reviews:z.object({...base,author_name:title,country:short.nullable(),rating:z.number().int().min(1).max(5),body:long.min(1),status:z.enum(["approved","pending"]),source_link:https,tour_id:mediaId,reviewed_on:date,photo_media_id:mediaId}),
  team:z.object({...base,name:title,role:title,bio:long,languages:lines,photo_media_id:mediaId}),
  vehicles:z.object({...base,name:title,description:long,passenger_capacity:z.number().int().min(1).max(200),luggage_capacity:z.number().int().min(0).max(200).nullable(),features:lines,cover_media_id:mediaId}),
  faqs:z.object({...base,question:title,answer:long.min(1),category:short,tour_id:mediaId}),
  pages:z.object({...base,title,seo}),
};
export type Entity=keyof typeof entitySchemas;
const commonFields:Field[]=[{name:"slug",label:"Slug"},{name:"published",label:"Published",type:"checkbox"}];
export const entityConfig:Record<Entity,{table:string;label:string;titleKey:string;defaults:Record<string,unknown>;fields:Field[]}>= {
  places:{table:"places",label:"Places",titleKey:"name",defaults:{name:"",description:"",region:"",latitude:7.8731,longitude:80.7718,coordinates_approximate:true,cover_media_id:null,photos:[],best_time:"",tips:"",seo:{}},fields:[{name:"name",label:"Name"},...commonFields,{name:"description",label:"Description",type:"long"},{name:"region",label:"Region"},{name:"best_time",label:"Best time to visit"},{name:"tips",label:"Tips",type:"long"},{name:"latitude",label:"Latitude",type:"number"},{name:"longitude",label:"Longitude",type:"number"},{name:"coordinates_approximate",label:"Coordinates are approximate",type:"checkbox"},{name:"cover_media_id",label:"Cover image",type:"image"},{name:"photos",label:"Photos",type:"gallery"}]},
  reviews:{table:"reviews",label:"Reviews",titleKey:"author_name",defaults:{author_name:"",country:"",rating:5,body:"",status:"pending",source_link:null,tour_id:null,reviewed_on:null,photo_media_id:null},fields:[{name:"author_name",label:"Guest name"},...commonFields,{name:"country",label:"Country"},{name:"rating",label:"Rating (1–5)",type:"number"},{name:"body",label:"Review",type:"long"},{name:"reviewed_on",label:"Date",type:"date"},{name:"tour_id",label:"Linked tour",type:"select",nullable:true},{name:"source_link",label:"Source link (HTTPS)"},{name:"photo_media_id",label:"Guest photo",type:"image"},{name:"status",label:"Approval",type:"select",options:[{value:"pending",label:"Pending"},{value:"approved",label:"Approved"}]}]},
  team:{table:"team_members",label:"Team",titleKey:"name",defaults:{name:"",role:"",bio:"",languages:[],photo_media_id:null},fields:[{name:"name",label:"Name"},...commonFields,{name:"role",label:"Role"},{name:"bio",label:"Biography",type:"long"},{name:"languages",label:"Languages (one per line)",type:"lines"},{name:"photo_media_id",label:"Photo",type:"image"}]},
  vehicles:{table:"vehicles",label:"Vehicles",titleKey:"name",defaults:{name:"",description:"",passenger_capacity:1,luggage_capacity:null,features:[],cover_media_id:null},fields:[{name:"name",label:"Name"},...commonFields,{name:"description",label:"Description",type:"long"},{name:"passenger_capacity",label:"Passenger capacity",type:"number"},{name:"luggage_capacity",label:"Luggage capacity",type:"number",nullable:true},{name:"features",label:"Features (one per line)",type:"lines"},{name:"cover_media_id",label:"Image",type:"image"}]},
  faqs:{table:"faqs",label:"FAQs",titleKey:"question",defaults:{question:"",answer:"",category:"general",tour_id:null},fields:[{name:"question",label:"Question"},...commonFields,{name:"answer",label:"Answer",type:"long"},{name:"category",label:"Category"},{name:"tour_id",label:"Linked tour",type:"select",nullable:true}]},
  pages:{table:"pages",label:"Pages",titleKey:"title",defaults:{title:"",seo:{}},fields:[{name:"title",label:"Title"},...commonFields,{name:"seo.title",label:"SEO title"},{name:"seo.description",label:"SEO description",type:"long"}]},
};
export function isEntity(value:string):value is Entity{return Object.prototype.hasOwnProperty.call(entityConfig,value);}
const ctaLink=z.string().max(2048).refine(v=>!v || (/^\/(?!\/)/.test(v)&&!/[\s\\%]/.test(v)) || (https.safeParse(v).success&&!!v),"Use an internal path or HTTPS URL");
const contentBase={heading:short.default(""),body:long.default("")};
export const sectionContents={
  hero:z.object({...contentBase,eyebrow:short.default(""),cta_label:short.default(""),cta_href:ctaLink.default(""),image:mediaId.default(null)}).passthrough(),
  rich_text:z.object(contentBase).passthrough(),
  gallery:z.object({heading:short.default(""),photos:photos.default([])}).passthrough(),
  cta:z.object({...contentBase,cta_label:short.default(""),cta_href:ctaLink.default("")}).passthrough(),
};
export type SectionType=keyof typeof sectionContents;
export type Section={id:string;type:SectionType;published:boolean;content:Record<string,unknown>};
export const sectionsSchema=z.array(z.object({id:z.uuid(),type:z.enum(["hero","rich_text","gallery","cta"]),published:z.boolean(),content:z.record(z.string(),z.unknown())})).max(100).superRefine((sections,ctx)=>{
  if(new Set(sections.map(s=>s.id)).size!==sections.length)ctx.addIssue({code:"custom",message:"Duplicate section IDs"});
  sections.forEach((s,i)=>{const parsed=sectionContents[s.type].safeParse(s.content);if(!parsed.success)parsed.error.issues.forEach(issue=>ctx.addIssue({code:"custom",path:[i,"content",...issue.path],message:issue.message}));});
});
export const inquirySchema=z.object({id:z.uuid(),updated_at:z.string(),status:z.enum(["new","replied","booked"]),notes:z.string().max(20000)});
