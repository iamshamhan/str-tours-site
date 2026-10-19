import "server-only";
import { getPublicSettings } from "@/lib/settings/public";
export async function notifyOwner(){
  const provider=process.env.INQUIRY_EMAIL_PROVIDER,key=process.env.INQUIRY_EMAIL_API_KEY,from=process.env.INQUIRY_EMAIL_FROM,to=process.env.INQUIRY_EMAIL_TO;
  if(!provider||!key||!from||!to)return;
  try{
    const settings=await getPublicSettings(),text=settings?.ui.emailBody,subject=settings?.ui.emailSubject;
    if(!text||!subject)return;
    if(provider==="resend")await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify({from,to:[to],subject,text}),signal:AbortSignal.timeout(5000)});
    if(provider==="postmark")await fetch("https://api.postmarkapp.com/email",{method:"POST",headers:{"X-Postmark-Server-Token":key,"Content-Type":"application/json"},body:JSON.stringify({From:from,To:to,Subject:subject,TextBody:text}),signal:AbortSignal.timeout(5000)});
  }catch{/* The inquiry is saved even when optional notifications are unavailable. */}
}
