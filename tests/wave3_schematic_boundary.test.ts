import test from 'ava'

test('Wave 3: schematic port offset and boundary coordinate calculations', (t) => {
  const calculatePortCoordinate = (baseX: number, baseY: number, offsetX: number, offsetY: number) => {
    return {
      x: Math.round((baseX + offsetX) * 100) / 100,
      y: Math.round((baseY + offsetY) * 100) / 100,
    }
  }

  const portPos = calculatePortCoordinate(10.5, 20.25, 2.5, -1.25)
  t.is(portPos.x, 13.0)
  t.is(portPos.y, 19.0)
})

test('Wave 3: pin layout collision avoidance heuristic bounds check', (t) => {
  const isClearanceValid = (p1: {x: number, y: number}, p2: {x: number, y: number}, minClearance: number) => {
    const dist = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2))
    return dist >= minClearance
  }

  t.true(isClearanceValid({x: 0, y: 0}, {x: 5, y: 0}, 2.54))
  t.false(isClearanceValid({x: 0, y: 0}, {x: 1, y: 0}, 2.54))
})
