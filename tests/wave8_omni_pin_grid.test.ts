import test from 'ava'

test('Wave 8 Omni: Schematic IC pin grid coordinate pitch alignment calculation', (t) => {
  const calculatePinPosition = (baseX: number, baseY: number, pinIndex: number, pitch: number, orientation: 'vertical' | 'horizontal') => {
    if (orientation === 'vertical') {
      return { x: baseX, y: baseY + pinIndex * pitch }
    }
    return { x: baseX + pinIndex * pitch, y: baseY }
  }

  const pin0 = calculatePinPosition(0, 0, 0, 2.54, 'vertical')
  const pin1 = calculatePinPosition(0, 0, 1, 2.54, 'vertical')
  const pin2 = calculatePinPosition(0, 0, 2, 2.54, 'vertical')

  t.is(pin0.y, 0)
  t.is(pin1.y, 2.54)
  t.is(pin2.y, 5.08)
})

test('Wave 8 Omni: Chip package aspect ratio bounds verification', (t) => {
  const isValidAspectRatio = (width: number, height: number, maxRatio: number = 10.0) => {
    if (width <= 0 || height <= 0) return false
    const ratio = width > height ? width / height : height / width
    return ratio <= maxRatio
  }

  t.true(isValidAspectRatio(10, 10))
  t.true(isValidAspectRatio(20, 5))
  t.false(isValidAspectRatio(100, 2))
  t.false(isValidAspectRatio(-5, 10))
})
