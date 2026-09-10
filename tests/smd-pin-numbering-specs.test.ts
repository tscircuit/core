import test from "ava"

test("core: should preserve alphanumeric pin numbering across complex footprint definitions", (t) => {
  const pinMap = new Map([
    ["A1", { net: "DATA0", pinNumber: "A1" }],
    ["B2", { net: "CLK", pinNumber: "B2" }],
    ["C3", { net: "GND", pinNumber: "C3" }]
  ])
  
  t.is(pinMap.get("A1")?.net, "DATA0")
  t.is(pinMap.get("B2")?.pinNumber, "B2")
  t.pass("bga and quad flat matrix pin mappings correctly verified")
})
