const assert = require("node:assert/strict")

const core = require("@tscircuit/core")

assert.equal(typeof core.RootCircuit, "function")
assert.equal(typeof core.createUseComponent, "function")

console.log("CJS require('@tscircuit/core') loaded successfully")
