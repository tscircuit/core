import { describe, test, expect } from "bun:test"
import { Group } from "../../../../../lib/components/primitive-components/Group/Group"
import { PrimitiveComponent } from "../../../../../lib/components/base-components/PrimitiveComponent"
import { Circuit } from "../../../../../lib/Circuit"
import { z } from "zod"
import { su } from "@tscircuit/soup-util"
import type { AnyCircuitElement } from "circuit-json"

// Mock component for testing
class MockComponent extends PrimitiveComponent {
  get config() {
    return {
      componentName: "MockComponent",
      zodProps: z
        .object({
          pcbX: z.number().optional(),
          pcbY: z.number().optional(),
          pcbRotation: z.number().optional(),
        })
        .passthrough(),
    }
  }

  // Make it a PCB primitive for bounds calculation
  isPcbPrimitive = true

  // Implement required PCB primitive methods
  _getGlobalPcbPositionBeforeLayout() {
    const width = this.getPcbSize().width
    const height = this.getPcbSize().height
    return {
      x: (this._parsedProps.pcbX ?? 0) + width / 2,
      y: (this._parsedProps.pcbY ?? 0) + height / 2,
    }
  }

  getPcbSize() {
    return {
      width: 30,
      height: 40,
    }
  }

  getBounds() {
    return {
      minX: 10,
      minY: 20,
      width: 30,
      height: 40,
    }
  }

  _getPcbCircuitJsonBounds() {
    return {
      center: { x: 25, y: 40 },
      bounds: { left: 10, top: 20, right: 40, bottom: 60 },
      width: 30,
      height: 40,
    }
  }
}

describe("Group", () => {
  test("PCB group size calculation and positioning", () => {
    const circuit = new Circuit()
    const group = new Group({
      pcbX: 0,
      pcbY: 0,
      pcbRotation: 0,
    })
    const mockChild = new MockComponent({
      pcbX: 10,
      pcbY: 20,
      pcbRotation: 0,
    })

    // Set up component hierarchy using proper methods
    group.add(mockChild)
    circuit.add(group)

    // Render the circuit to initialize everything
    circuit.render()

    // Test initial PCB component render
    group.doInitialPcbComponentRender()
    const pcbGroups = circuit.db
      .toArray()
      .filter((item: AnyCircuitElement) => item.type === "source_group")

    // Use double casting to handle plugin-added properties
    const pcbGroup = pcbGroups[0] as unknown as {
      type: "source_group"
      source_group_id: string
      anchor: { x: number; y: number }
      rotation: number
    }

    expect(pcbGroup).toBeDefined()
    expect(pcbGroup.anchor).toEqual({
      x: 25, // minX + width/2
      y: 40, // minY + height/2
    })
    expect(pcbGroup.rotation).toBe(0)

    // Test PCB group size calculation
    group.doInitialPcbGroupSizeCalculation()
    const updatedPcbGroups = circuit.db
      .toArray()
      .filter((item: AnyCircuitElement) => item.type === "source_group")

    // Use double casting for updated group with plugin-added properties
    const updatedPcbGroup = updatedPcbGroups[0] as unknown as {
      type: "source_group"
      source_group_id: string
      center: { x: number; y: number }
      width: number
      height: number
    }

    expect(updatedPcbGroup).toBeDefined()
    expect(updatedPcbGroup.center).toEqual({
      x: 25, // minX + width/2
      y: 40, // minY + height/2
    })
    expect(updatedPcbGroup.width).toBe(32) // width + padding*2
    expect(updatedPcbGroup.height).toBe(42) // height + padding*2
  })
})
