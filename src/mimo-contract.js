/**
 * Axiom ⇄ Mimo contract preview. No network and no credentials in this module.
 * Actual Mimo project keys MUST be owned by a future trusted server proxy.
 * Reference: Mimo docs/EXTERNAL_API_V2.md
 */
export const WORKFLOW_MAP=Object.freeze({
 chat:{workflow_id:"math_chat",version:1},solve:{workflow_id:"math_solve",version:1},
 tikz:{workflow_id:"math_tikz",version:1},
 prove:{workflow_id:"math_prove",version:1},verify:{workflow_id:"math_verify",version:1},
 explain:{workflow_id:"math_explain",version:1},latex:{workflow_id:"math_latex",version:1},
 quiz:{workflow_id:"math_quiz",version:1},extract:{workflow_id:"math_extract",version:1},
 simplify:{workflow_id:"math_simplify",version:1},analyze:{workflow_id:"math_analyze",version:1},
 code:{workflow_id:"math_code",version:1}
});
export const LOCAL_COMMANDS=Object.freeze(["graph","note"]);
const VALID_ID=/^[a-z0-9][a-z0-9_-]{0,100}$/i;
export function newClientRequestId(){
  return typeof crypto!=="undefined"&&typeof crypto.randomUUID==="function"?crypto.randomUUID():`local-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
}
export function makePreviewRequest({command="chat",input="",threadId="new",attachmentName=null,clientRequestId="local-preview"}={}){
  if (LOCAL_COMMANDS.includes(command)) return {
    method: "LOCAL", url: null, status: "local_only",
    body: { command, input: { text: String(input) }, session_id: String(threadId), client_request_id: String(clientRequestId) },
    note: "Runs entirely in the browser. Do not dispatch a Mimo workflow or bill for graphing/notebook edits."
  };
  const route=WORKFLOW_MAP[command]||WORKFLOW_MAP.chat;
  return {
    method:"POST",
    url:"/api/chat/runs",
    body:{
      workflow:route.workflow_id,
      version:route.version,
      command,
      input:{text:String(input),attachment:attachmentName?{name:String(attachmentName),status:"local_only_not_uploaded"}:null},
      session_id:String(threadId),
      client_request_id:String(clientRequestId),
      background:true
    },
    status:"preview_only",
    note:"The browser must call your own authenticated server proxy, never Mimo with its project key."
  };
}
/** A future proxy may translate a validated client request into this Mimo call. */
export function toMimoServerRequest(preview){
  const body=preview?.body||{};
  if (preview?.status === "local_only" || LOCAL_COMMANDS.includes(body.command))
    throw new Error("Local browser tools must not be sent to Mimo");
  const route=WORKFLOW_MAP[body.command]||WORKFLOW_MAP.chat;
  if(!VALID_ID.test(route.workflow_id))throw new Error("Invalid server workflow identifier");
  if(typeof body.input?.text!=="string")throw new Error("Missing text input");
  return {
    method:"POST",
    path:`/v1/workflows/${encodeURIComponent(route.workflow_id)}/runs`,
    headers:{"Content-Type":"application/json","Idempotency-Key":body.client_request_id},
    body:{input:body.input.text,version:route.version,background:Boolean(body.background)},
    // The server adds Authorization: Bearer <PRIVATE_PROJECT_KEY> from Secret Manager.
    credentials:"server-side only"
  };
}
export function normalizeRun(run){
  const status=String(run?.status||"unknown").toLowerCase();
  return {id:String(run?.id||""),status,done:["completed","failed","cancelled","canceled"].includes(status),output:run?.output??null};
}
