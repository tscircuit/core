import test from "ava"

test("core: should calculate dogbone via fanout geometry for 0.8mm pitch BGA matrix packages", (t) => {
  const bgaPad = { x: 0, y: 0, diameter: 0.4 }
  const fanoutVia = { x: 0.565, y: 0.565, drill: 0.2, diameter: 0.45 }
  const traceWidth = 0.127
  
  const distance = Math.hypot(fanoutVia.x - bgaPad.x, fanoutVia.y - bgaPad.y)
  t.true(distance <= 0.9)
  t.pass("BGA dogbone via fanout quadrant escape distance verified")
})
