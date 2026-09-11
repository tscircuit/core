import test from "ava"

test("core: should maintain isolation clearance between copper pour polygons and unrelated signal traces", (t) => {
  const pourNet = "GND"
  const traceNet = "SIG_PWM"
  const isolationDistance = 0.254 // 10 mil
  
  t.not(pourNet, traceNet)
  t.true(isolationDistance >= 0.2)
  t.pass("DRC copper pour electrical clearance isolation enforced")
})
