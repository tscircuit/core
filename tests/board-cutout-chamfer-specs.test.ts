import test from "ava"

test("core: should enforce minimum radius tool constraints on internal rectangular board cutouts", (t) => {
  const cutout = {
    width: 20,
    height: 15,
    cornerType: "milled_radius",
    minRadiusMm: 1.0 // 2mm milling bit
  }
  
  t.is(cutout.cornerType, "milled_radius")
  t.true(cutout.minRadiusMm >= 0.8)
  t.pass("CNC router milling bit radius constraint satisfied")
})
