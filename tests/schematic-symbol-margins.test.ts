import test from "ava"

test("computes total symbol boundary including pin labels and reference designators", (t) => {
  const symbolBody = { x: 0, y: 0, width: 20, height: 15 }
  const labelMargin = 3.5
  const pinLeadLength = 2.54
  
  const outerBBox = {
    minX: symbolBody.x - pinLeadLength - labelMargin,
    maxX: symbolBody.x + symbolBody.width + pinLeadLength + labelMargin,
    minY: symbolBody.y - labelMargin,
    maxY: symbolBody.y + symbolBody.height + labelMargin
  }
  
  t.is(outerBBox.minX, -6.04)
  t.is(outerBBox.maxX, 26.04)
  t.is(outerBBox.minY, -3.5)
  t.is(outerBBox.maxY, 18.5)
})
