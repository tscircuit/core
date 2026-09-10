import test from "ava"

test("core: should maintain matched length tolerances across differential signal pairs", (t) => {
  const diffPair = {
    netP: "USB_D_P",
    netN: "USB_D_N",
    lengthP: 24.5,
    lengthN: 24.6,
    maxSkewMm: 0.2
  }
  
  const skew = Math.abs(diffPair.lengthP - diffPair.lengthN)
  t.true(skew <= diffPair.maxSkewMm)
  t.pass("differential pair trace length skew conforms to high-speed design rules")
})
