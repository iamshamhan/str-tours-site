"use server";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { after } from "next/server";
import { getPublicSettings } from "@/lib/settings/public";
import { createPublicClient } from "@/lib/supabase/public";
import { tripSchema,reviewSubmissionSchema } from "@/lib/public/submission-schema";
import { allowSubmission } from "@/lib/public/submission-limit";
import { notifyOwner } from "@/lib/public/notify";
type Result={status:"success"|"validation"|"error"|"rateLimited"};
async function submissionClient(startedAt:number){
  const h=await headers(),ip=(h.get("x-vercel-forwarded-for")||h.get("x-forwarded-for")||"local").split(",")[0].trim().slice(0,100);
  const key=createHash("sha256").update(`${process.env.NEXT_PUBLIC_SUPABASE_URL}:${ip}`).digest("hex");
  if(!allowSubmission(key))return null;
  return createPublicClient({"x-submission-key":key,"x-form-started":String(startedAt)});
}
export async function submitTrip(input:unknown):Promise<Result>{
  const parsed=tripSchema.safeParse(input);if(!parsed.success)return {status:"validation"};
  const v=parsed.data;if(v.website)return {status:"success"};
  if(Date.now()-v.startedAt<1500||Date.now()-v.startedAt>86400000)return {status:"validation"};
  const settings=await getPublicSettings();if(!settings?.inquiriesEnabled)return {status:"error"};
  const client=await submissionClient(v.startedAt);if(!client)return {status:"rateLimited"};
  try{
    const {error}=await client.from("inquiries").insert({name:v.name,email:v.email,country:v.country,phone:v.whatsapp||null,travel_date:v.startDate||null,travel_end_date:v.endDate||null,travelers:v.travellers,interests:v.interests,budget:v.budget,message:v.message,tour_id:v.tourId,consent:true});
    if(error)return {status:error.message.includes("rate_limit")?"rateLimited":"error"};
    after(notifyOwner);return {status:"success"};
  }catch{return {status:"error"};}
}
export async function submitPublicReview(input:unknown):Promise<Result>{
  const parsed=reviewSubmissionSchema.safeParse(input);if(!parsed.success)return {status:"validation"};
  const v=parsed.data;if(v.website)return {status:"success"};
  if(Date.now()-v.startedAt<1500||Date.now()-v.startedAt>86400000)return {status:"validation"};
  const settings=await getPublicSettings();if(!settings?.publicReviews)return {status:"error"};
  const client=await submissionClient(v.startedAt);if(!client)return {status:"rateLimited"};
  try{
    const {error}=await client.from("reviews").insert({author_name:v.name,country:v.country||null,rating:v.rating,body:v.message,tour_id:v.tourId,reviewed_on:v.date||null,consent:true});
    return {status:error?(error.message.includes("rate_limit")?"rateLimited":"error"):"success"};
  }catch{return {status:"error"};}
}
