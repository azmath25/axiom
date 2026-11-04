import test from "node:test";
import assert from "node:assert/strict";
import { WORKFLOW_MAP,LOCAL_COMMANDS,makePreviewRequest,toMimoServerRequest,normalizeRun } from "../src/mimo-contract.js";
test("client request is a safe no-network preview",()=>{
 const c=makePreviewRequest({command:"tikz",input:"triangle",threadId:"t1",clientRequestId:"req-1",attachmentName:"figure.png"});
 assert.equal(c.method,"POST");assert.equal(c.url,"/api/chat/runs");assert.equal(c.status,"preview_only");
 assert.equal(c.body.workflow,WORKFLOW_MAP.tikz.workflow_id);
 assert.equal(c.body.input.attachment.status,"local_only_not_uploaded");
 assert(!JSON.stringify(c).includes("Bearer"));
});
test("Mimo proxy mapping follows versioned published run + idempotency API",()=>{
 const c=makePreviewRequest({command:"solve",input:"2x+3=7",clientRequestId:"run-x"});
 const server=toMimoServerRequest(c);
 assert.equal(server.path,"/v1/workflows/math_solve/runs");
 assert.equal(server.headers["Idempotency-Key"],"run-x");
 assert.deepEqual(server.body,{input:"2x+3=7",version:1,background:true});
 assert.equal(server.credentials,"server-side only");
});
test("normalizing Mimo run statuses never assumes a request is complete",()=>{
 assert.equal(normalizeRun({id:"abc",status:"queued"}).done,false);
 assert.equal(normalizeRun({id:"abc",status:"completed",output:{ok:true}}).done,true);
 assert.equal(normalizeRun({id:"abc",status:"failed"}).done,true);
});

test("graph and notebook stay fully browser-side and cannot be converted to Mimo runs",()=>{
 for(const cmd of LOCAL_COMMANDS){
  const local=makePreviewRequest({command:cmd,input:"x^2",threadId:"c1"});
  assert.equal(local.status,"local_only");
  assert.equal(local.method,"LOCAL");
  assert.equal(local.url,null);
  assert.throws(()=>toMimoServerRequest(local),/must not be sent/);
  assert.equal(WORKFLOW_MAP[cmd],undefined);
 }
});
