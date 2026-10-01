import { expect, test } from "bun:test"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { Board } from "lib/components/normal-components/Board/Board"
import { Resistor } from "lib/components/normal-components/Resistor"
import { Footprint } from "lib/components/primitive-components/Footprint"
import { SmtPad } from "lib/components/primitive-components/SmtPad"
import {
  createLoadingRevisionCircuit,
  disposeLoadingRevisionCircuit,
  external0402Footprint,
  reportLoadingRevisionObservation,
} from "./loading-fixtures"

/** Footprint-local pad centers in mm: +X right, +Y top, right-handed, +Z above. */
function createInstanceFootprint(): Footprint {
  const footprint = new Footprint({})
  footprint.addAll(
    [-0.51, 0.51].map(
      (pcbX, padIndex) =>
        new SmtPad({
          shape: "rect",
          layer: "top",
          pcbX,
          pcbY: 0,
          width: 0.54,
          height: 0.64,
          portHints: [`pin${padIndex + 1}`],
        }),
    ),
  )
  return footprint
}

const footprintCases = [
  {
    scenario: "circuit_json_array",
    createFootprint: () => structuredClone(external0402Footprint),
  },
  {
    scenario: "footprint_instance",
    createFootprint: createInstanceFootprint,
  },
  {
    scenario: "footprinter_string",
    createFootprint: () => "0402",
  },
] as const

class DirtyFootprintResistor extends Resistor {
  propsChangeCalls = 0

  override onPropsChange(params: Parameters<Resistor["onPropsChange"]>[0]) {
    super.onPropsChange(params)
    this.propsChangeCalls++
    this._markDirty("PcbFootprintStringRender")
  }
}

function collectPadDescendants(
  component: PrimitiveComponent,
): PrimitiveComponent[] {
  const pads: PrimitiveComponent[] = []
  for (const child of component.children) {
    if (child.componentName === "SmtPad") pads.push(child)
    pads.push(...collectPadDescendants(child))
  }
  return pads
}

async function observeDirtyFootprintCase(
  footprintCase: (typeof footprintCases)[number],
) {
  const circuit = createLoadingRevisionCircuit({ drcChecksDisabled: true })
  try {
    const board = new Board({ width: 10, height: 10 })
    // Exercise accepted dynamic JavaScript inputs absent from FootprintProp.
    const resistor = Reflect.construct(DirtyFootprintResistor, [
      {
        name: "R1",
        resistance: "10k",
        footprint: footprintCase.createFootprint(),
      },
    ])
    if (!(resistor instanceof DirtyFootprintResistor))
      throw new Error("Expected a constructed public resistor extension")
    board.add(resistor)
    circuit.add(board)
    await circuit.renderUntilSettled()

    const childrenBefore = [...resistor.children]
    const padDescendantsBefore = collectPadDescendants(resistor)
    const selectedPadsBefore = [...resistor.selectAll("smtpad")]
    const jsonBefore = structuredClone(circuit.getCircuitJson())
    const padRowsBefore = jsonBefore.filter(
      (element) => element.type === "pcb_smtpad",
    )

    // All required props are present, and the authored footprint is unchanged.
    // The extension hook alone requests another footprint phase.
    resistor.setProps({ ...resistor.props })
    const childrenAfterProps = [...resistor.children]
    const jsonAfterProps = structuredClone(circuit.getCircuitJson())
    await circuit.renderUntilSettled()

    const childrenAfter = [...resistor.children]
    const padDescendantsAfter = collectPadDescendants(resistor)
    const selectedPadsAfter = [...resistor.selectAll("smtpad")]
    const jsonAfter = structuredClone(circuit.getCircuitJson())
    const padRowsAfter = jsonAfter.filter(
      (element) => element.type === "pcb_smtpad",
    )
    reportLoadingRevisionObservation("S4", footprintCase.scenario, {
      propsChangeCalls: resistor.propsChangeCalls,
      childNamesBefore: childrenBefore.map((child) => child.componentName),
      childNamesAfterProps: childrenAfterProps.map(
        (child) => child.componentName,
      ),
      childNamesAfter: childrenAfter.map((child) => child.componentName),
      childIdentityIndices: childrenAfter.map((child) =>
        childrenBefore.indexOf(child),
      ),
      padDescendantCounts: [
        padDescendantsBefore.length,
        padDescendantsAfter.length,
      ],
      padDescendantIdentityIndices: padDescendantsAfter.map((pad) =>
        padDescendantsBefore.indexOf(pad),
      ),
      selectedPadCounts: [selectedPadsBefore.length, selectedPadsAfter.length],
      selectedPadIdentityIndices: selectedPadsAfter.map((pad) =>
        selectedPadsBefore.indexOf(pad),
      ),
      padRowsBefore,
      padRowsAfter,
      jsonBefore,
      jsonAfterProps,
      jsonAfter,
    })
    return {
      scenario: footprintCase.scenario,
      propsChangeCalls: resistor.propsChangeCalls,
      childrenBefore,
      childrenAfterProps,
      childrenAfter,
      padDescendantsBefore,
      padDescendantsAfter,
      selectedPadsBefore,
      selectedPadsAfter,
      padRowsBefore,
      padRowsAfter,
      jsonBefore,
      jsonAfterProps,
      jsonAfter,
    }
  } finally {
    await disposeLoadingRevisionCircuit(circuit)
  }
}

test("dirtying a settled footprint through a public props hook preserves its children and Circuit JSON", async () => {
  const observations: Awaited<ReturnType<typeof observeDirtyFootprintCase>>[] =
    []
  // Record every case before asserting, so a failure still yields all controls.
  for (const footprintCase of footprintCases) {
    observations.push(await observeDirtyFootprintCase(footprintCase))
  }
  for (const observation of observations) {
    expect(observation.propsChangeCalls).toBe(1)
    expect(observation.padDescendantsBefore).toHaveLength(2)
    expect(observation.selectedPadsBefore).toHaveLength(2)
    expect(observation.padRowsBefore).toHaveLength(2)
    expect(observation.childrenAfterProps).toHaveLength(
      observation.childrenBefore.length,
    )
    expect(observation.childrenAfter).toHaveLength(
      observation.childrenBefore.length,
    )
    for (const [childIndex, child] of observation.childrenBefore.entries()) {
      expect(observation.childrenAfterProps[childIndex]).toBe(child)
      expect(observation.childrenAfter[childIndex]).toBe(child)
    }
    expect(observation.padDescendantsAfter).toHaveLength(2)
    expect(observation.selectedPadsAfter).toHaveLength(2)
    for (const [padIndex, pad] of observation.padDescendantsBefore.entries()) {
      expect(observation.padDescendantsAfter[padIndex]).toBe(pad)
    }
    for (const [padIndex, pad] of observation.selectedPadsBefore.entries()) {
      expect(observation.selectedPadsAfter[padIndex]).toBe(pad)
    }
    expect(observation.padRowsAfter).toEqual(observation.padRowsBefore)
    expect(observation.jsonAfterProps).toEqual(observation.jsonBefore)
    expect(observation.jsonAfter).toEqual(observation.jsonBefore)
  }
})
