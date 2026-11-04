import test from "node:test";
import assert from "node:assert/strict";
import { COMMANDS,parseCommand,getCommand,searchCommands } from "../src/commands.js";
test("command catalog includes the intended math toolchain",()=>{
 const names=new Set(COMMANDS.map(x=>x.id));
 for(const name of ["solve","tikz","graph","prove","verify","latex","extract","quiz"])assert(names.has(name));
 assert.equal(names.size,COMMANDS.length);
});
test("slash parser handles commands, fallback and malformed inputs",()=>{
 assert.deepEqual(parseCommand("/solve 2x+3 = 7").command,"solve");
 assert.equal(parseCommand("/Graph y = sin(x)").input,"y = sin(x)");
 assert.equal(parseCommand("Prove it").command,"chat");
 assert.equal(parseCommand("/unknown whatever").recognized,false);
 assert.equal(getCommand("graph")?.group,"Visualize");
 assert(searchCommands("proof").some(x=>x.id==="verify"));
});
