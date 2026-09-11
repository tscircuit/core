import test from "ava"

test("verifies differential pair trace length skew delta within allowable tolerance limits", (t) => {
  const diffPair = {
    netP: { length: 45.2, width: 0.15 },
    netN: { length: 45.5, width: 0.15 },
    maxAllowedSkew: 0.5
  }
  
  const skewDelta = Math.abs(diffPair.netP.length - diffPair.netN.length)
  t.is(skewDelta, 0.30000000000000426)
  t.true(skewDelta <= diffPair.maxAllowedSkew)
})
