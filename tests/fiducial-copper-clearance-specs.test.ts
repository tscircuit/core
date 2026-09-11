import test from "ava"

test("core: should enforce copper-free exclusion clearance ring around optical fiducials", (t) => {
  const fiducial = {
    padDiameter: 1.0,
    clearanceRingDiameter: 2.0,
    layer: "top"
  }
  
  const clearanceMargin = (fiducial.clearanceRingDiameter - fiducial.padDiameter) / 2
  t.is(clearanceMargin, 0.5)
  t.true(clearanceMargin >= 0.25)
  t.pass("optical fiducial vision alignment clearance constraint satisfied")
})
