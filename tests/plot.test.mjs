import test from "node:test";
import assert from "node:assert/strict";
import { tokenize,compileExpression } from "../src/plot.js";
const approx=(a,b)=>assert(Math.abs(a-b)<1e-10,`Expected ${a} ≈ ${b}`);
test("calculator parser evaluates 2D functions without JavaScript execution",()=>{
 approx(compileExpression("y = sin(x) + 0.25*cos(3*x)")(0),.25);
 approx(compileExpression("x^2 + 2*x + 1")(-1),0);
 approx(compileExpression("2^3^2")(0),512);
 approx(compileExpression("-x^2")(3),-9);
 approx(compileExpression("sqrt(9)+ln(e)")(0),4);
 approx(compileExpression("log(100)")(0),2);
 approx(compileExpression("pi")(0),Math.PI);
});
test("unsafe or unsupported expression is rejected",()=>{
 for(const expression of ["alert(1)","Math.sin(x)","x;process.exit()","constructor","x + __proto__","sin(x"])assert.throws(()=>compileExpression(expression));
 assert.equal(tokenize("y=x").length,2);
});
