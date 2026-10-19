import test from "node:test";
import assert from "node:assert/strict";
import {validateChallenge} from "../src/lib/security/turnstile-core.ts";
const config={siteKey:"test-site",secret:"test-secret"};
const response=(value,status=200)=>async()=>new Response(JSON.stringify(value),{status});
test("optional challenge skips only when both keys are absent",async()=>{
 assert.equal(await validateChallenge(undefined,"admin_login","example.com",{},()=>{throw Error("Must not call provider");}),true);
 assert.equal(await validateChallenge("token","admin_login","example.com",{siteKey:"test"}),false);
 assert.equal(await validateChallenge("token","admin_login","example.com",{secret:"test"}),false);
});
test("server challenge requires success, matching action and exact hostname",async()=>{
 const good={success:true,action:"trip_inquiry",hostname:"example.com"};
 assert.equal(await validateChallenge("token","trip_inquiry","example.com",config,response(good)),true);
 for(const bad of [{...good,success:false},{...good,action:"admin_login"},{...good,hostname:"attacker.example.com"},null])assert.equal(await validateChallenge("token","trip_inquiry","example.com",config,response(bad)),false);
 assert.equal(await validateChallenge("token","trip_inquiry","example.com",config,response(good,503)),false);
 assert.equal(await validateChallenge("token","trip_inquiry","example.com",config,async()=>{throw Error("Offline");}),false);
});
test("missing and oversized tokens are rejected before provider calls",async()=>{
 for(const token of [undefined,"",123,"x".repeat(2049)])assert.equal(await validateChallenge(token,"admin_login","example.com",config,()=>{throw Error("Must not call provider");}),false);
});
