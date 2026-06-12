import { test, expect } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"

test("pcbPack places chip on board edge when shouldBeOnEdgeOfBoard is true", async () => {
  const circuit = new RootCircuit()

  circuit.add(
    <board width="40mm" height="40mm" pcbPack pcbGap="0mm">
      <chip name="U1" footprint="soic8" shouldBeOnEdgeOfBoard />
      <resistor name="R1" resistance="1k" footprint="0402" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcbComponents = circuit.db.pcb_component.list()
  const sourceComponents = circuit.db.source_component.list()
  const smtpads = circuit.db.pcb_smtpad.list()

  console.log("SMTPADS:")
  console.log(JSON.stringify(smtpads, null, 2))

  const u1 = pcbComponents.find((c) => {
    const sourceComp = sourceComponents.find(
      (sc) => sc.source_component_id === c.source_component_id,
    )
    return sourceComp?.name === "U1"
  })

  expect(u1).toBeDefined()
  if (!u1) return

  // Find courtyard outlines of U1
  const u1Courtyards = circuit.db.pcb_courtyard_outline
    .list()
    .filter((c) => c.pcb_component_id === u1.pcb_component_id)

  let minBoundaryX = Infinity,
    maxBoundaryX = -Infinity
  let minBoundaryY = Infinity,
    maxBoundaryY = -Infinity

  if (u1Courtyards.length > 0) {
    for (const cy of u1Courtyards) {
      for (const pt of cy.outline) {
        minBoundaryX = Math.min(minBoundaryX, pt.x)
        maxBoundaryX = Math.max(maxBoundaryX, pt.x)
        minBoundaryY = Math.min(minBoundaryY, pt.y)
        maxBoundaryY = Math.max(maxBoundaryY, pt.y)
      }
    }
  } else {
    // Fallback to pads if no courtyard outline exists
    const u1Pads = smtpads.filter(
      (p) => p.pcb_component_id === u1.pcb_component_id,
    )
    for (const pad of u1Pads) {
      const p = pad as any
      const w = p.shape === "rect" ? p.width : p.radius * 2
      const h = p.shape === "rect" ? p.height : p.radius * 2
      minBoundaryX = Math.min(minBoundaryX, p.x - w / 2)
      maxBoundaryX = Math.max(maxBoundaryX, p.x + w / 2)
      minBoundaryY = Math.min(minBoundaryY, p.y - h / 2)
      maxBoundaryY = Math.max(maxBoundaryY, p.y + h / 2)
    }
  }

  console.log("Calculated boundary absolute bounds for U1:", {
    minBoundaryX,
    maxBoundaryX,
    minBoundaryY,
    maxBoundaryY,
    width: maxBoundaryX - minBoundaryX,
    height: maxBoundaryY - minBoundaryY,
  })

  const distToLeft = Math.abs(minBoundaryX - -20)
  const distToRight = Math.abs(maxBoundaryX - 20)
  const distToBottom = Math.abs(minBoundaryY - -20)
  const distToTop = Math.abs(maxBoundaryY - 20)

  const minDistance = Math.min(distToLeft, distToRight, distToBottom, distToTop)

  console.log("Distance from absolute bounds to board edges:", {
    distToLeft,
    distToRight,
    distToBottom,
    distToTop,
    minDistance,
  })

  // The component courtyard/pad boundary edge must be extremely close to the board boundary (within 0.1 mm)
  expect(minDistance).toBeLessThan(0.1)
})
