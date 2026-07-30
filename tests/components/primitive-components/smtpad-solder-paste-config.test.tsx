import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("solderPasteMargin applies an absolute per-side margin instead of the 0.7 scale", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="12mm" height="10mm">
      <smtpad
        shape="rect"
        width={2}
        height={1}
        solderPasteMargin={-0.1}
        layer="top"
        portHints={[]}
      />
    </board>,
  )
  circuit.render()

  const [solder_paste] = circuit.db.pcb_solder_paste.list()
  expect(solder_paste.shape).toBe("rect")
  if (solder_paste.shape === "rect") {
    expect(solder_paste.width).toBeCloseTo(1.8)
    expect(solder_paste.height).toBeCloseTo(0.8)
  }
})

test("a zero solderPasteMargin yields a 1:1 aperture", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="12mm" height="10mm">
      <smtpad
        shape="rect"
        width={2}
        height={1}
        solderPasteMargin={0}
        layer="top"
        portHints={[]}
      />
    </board>,
  )
  circuit.render()

  const [solder_paste] = circuit.db.pcb_solder_paste.list()
  expect(solder_paste.shape).toBe("rect")
  if (solder_paste.shape === "rect") {
    expect(solder_paste.width).toBeCloseTo(2)
    expect(solder_paste.height).toBeCloseTo(1)
  }
})

test("a positive solderPasteMargin grows the aperture beyond the pad", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="12mm" height="10mm">
      <smtpad
        shape="rect"
        width={2}
        height={1}
        solderPasteMargin={0.1}
        layer="top"
        portHints={[]}
      />
    </board>,
  )
  circuit.render()

  const [solder_paste] = circuit.db.pcb_solder_paste.list()
  expect(solder_paste.shape).toBe("rect")
  if (solder_paste.shape === "rect") {
    expect(solder_paste.width).toBeCloseTo(2.2)
    expect(solder_paste.height).toBeCloseTo(1.2)
  }
})

test("no solder paste is emitted when solderPasteMargin shrinks the aperture to zero", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="12mm" height="10mm">
      <smtpad
        shape="rect"
        width={2}
        height={1}
        solderPasteMargin={-0.6}
        layer="top"
        portHints={[]}
      />
    </board>,
  )
  circuit.render()

  expect(circuit.db.pcb_solder_paste.list().length).toBe(0)
  expect(circuit.db.pcb_smtpad.list().length).toBe(1)
})

test("circle pads apply solderPasteMargin to the radius once per side", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="12mm" height="10mm">
      <smtpad
        shape="circle"
        radius={0.5}
        solderPasteMargin={-0.1}
        layer="top"
        portHints={[]}
      />
    </board>,
  )
  circuit.render()

  const [solder_paste] = circuit.db.pcb_solder_paste.list()
  expect(solder_paste.shape).toBe("circle")
  if (solder_paste.shape === "circle") {
    expect(solder_paste.radius).toBeCloseTo(0.4)
  }
})

test("rotated_rect pads honor solderPasteMargin", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="12mm" height="10mm">
      <smtpad
        shape="rotated_rect"
        width={2}
        height={1}
        ccwRotation={45}
        solderPasteMargin={0}
        layer="top"
        portHints={[]}
      />
    </board>,
  )
  circuit.render()

  const [solder_paste] = circuit.db.pcb_solder_paste.list()
  expect(solder_paste.shape).toBe("rotated_rect")
  if (solder_paste.shape === "rotated_rect") {
    expect(solder_paste.width).toBeCloseTo(2)
    expect(solder_paste.height).toBeCloseTo(1)
    expect(solder_paste.ccw_rotation).toBeCloseTo(45)
  }
})

test("default behaviour without any paste props stays 0.7", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="12mm" height="10mm">
      <smtpad
        shape="rect"
        width={2}
        height={1}
        layer="top"
        portHints={[]}
        pcbX={-3}
      />
      <smtpad shape="circle" radius={0.5} layer="top" portHints={[]} pcbX={3} />
    </board>,
  )
  circuit.render()

  const pastes = circuit.db.pcb_solder_paste.list()
  const rectPaste = pastes.find((p) => p.shape === "rect")
  const circlePaste = pastes.find((p) => p.shape === "circle")
  if (rectPaste?.shape === "rect") {
    expect(rectPaste.width).toBeCloseTo(2 * 0.7)
    expect(rectPaste.height).toBeCloseTo(1 * 0.7)
  } else {
    throw new Error("Expected rect solder paste")
  }
  if (circlePaste?.shape === "circle") {
    expect(circlePaste.radius).toBeCloseTo(0.5 * 0.7)
  } else {
    throw new Error("Expected circle solder paste")
  }
})
