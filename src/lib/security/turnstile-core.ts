type Config={siteKey?:string;secret?:string};
export async function validateChallenge(token:unknown,action:"admin_login"|"trip_inquiry",hostname:string,config:Config,request:typeof fetch=fetch):Promise<boolean>{
 const {siteKey,secret}=config;
 if(!siteKey&&!secret)return true;
 if(!siteKey||!secret||typeof token!=="string"||!token||token.length>2048||!hostname)return false;
 try{
  const response=await request("https://challenges.cloudflare.com/turnstile/v0/siteverify",{method:"POST",body:new URLSearchParams({secret,response:token}),cache:"no-store",signal:AbortSignal.timeout(8000)});
  if(!response.ok)return false;
  const result:unknown=await response.json();if(!result||typeof result!=="object")return false;
  const data=result as Record<string,unknown>;
  return data.success===true&&data.action===action&&typeof data.hostname==="string"&&data.hostname.toLowerCase()===hostname.toLowerCase();
 }catch{return false;}
}
