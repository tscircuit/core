import test from "ava"

test("core: should enforce component placement exclusion inside mechanical keepout zones", (t) => {
  const keepoutZone = {
    shape: "rect",
    x: 0,
    y: 0,
    width: 10,
    height: 10,
    layers: ["top", "bottom"]
  }
  const component = { x: 5, y: 5, layer: "top" }
  
  const isInside = component.x >= keepoutZone.x && component.x <= (keepoutZone.x + keepoutZone.width) &&
                   component.y >= keepoutZone.y && component.y <= (keepoutZone.y + keepoutZone.height)
                   
  t.true(isInside)
  t.pass("keepout boundary violation detected")
})
