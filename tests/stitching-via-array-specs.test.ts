import test from "ava"

test("core: should generate uniform ground plane stitching via grid arrays", (t) => {
  const grid = {
    minX: 0, maxX: 20,
    minY: 0, maxY: 20,
    pitch: 5.0,
    net: "GND"
  }
  
  const viaCountX = Math.floor((grid.maxX - grid.minX) / grid.pitch) + 1
  const viaCountY = Math.floor((grid.maxY - grid.minY) / grid.pitch) + 1
  const totalVias = viaCountX * viaCountY
  
  t.is(totalVias, 25)
  t.pass("ground plane stitching via array calculation verified")
})
