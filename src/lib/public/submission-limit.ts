const attempts=new Map<string,{count:number;until:number}>();
export function allowSubmission(key:string,now=Date.now()){
  for(const [id,value] of attempts)if(value.until<=now)attempts.delete(id);
  const existing=attempts.get(key);
  if(existing){if(existing.count>=10)return false;existing.count++;return true;}
  if(attempts.size>=2000)return false;
  attempts.set(key,{count:1,until:now+15*60*1000});return true;
}
