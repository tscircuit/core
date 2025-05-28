import type { AnyCircuitElement } from "circuit-json"

export interface FakeFootprintServerOptions {
  port?: number
  delay?: number
}

export class FakeFootprintServer {
  private server: any
  private port: number
  private delay: number
  private footprints: Map<string, AnyCircuitElement[]> = new Map()

  constructor(options: FakeFootprintServerOptions = {}) {
    this.port = options.port ?? 0 // Let Bun assign a port
    this.delay = options.delay ?? 0
  }

  addFootprint(path: string, circuitJson: AnyCircuitElement[]) {
    this.footprints.set(path, circuitJson)
  }

  async start(): Promise<{ port: number; url: string }> {
    this.server = Bun.serve({
      port: this.port,
      fetch: async (request) => {
        const url = new URL(request.url)
        const path = url.pathname

        // Add delay if specified
        if (this.delay > 0) {
          await new Promise(resolve => setTimeout(resolve, this.delay))
        }

        if (this.footprints.has(path)) {
          const circuitJson = this.footprints.get(path)!
          return new Response(JSON.stringify(circuitJson), {
            headers: { "Content-Type": "application/json" },
          })
        }

        return new Response("Footprint not found", { status: 404 })
      },
    })

    const actualPort = this.server.port
    return { 
      port: actualPort, 
      url: `http://localhost:${actualPort}` 
    }
  }

  stop() {
    if (this.server) {
      this.server.stop()
    }
  }

  getUrl(path: string): string {
    return `http://localhost:${this.server.port}${path}`
  }
}

// Helper function to create common footprint circuit JSON
export function createSoic4FootprintJson(): AnyCircuitElement[] {
  return [
    {
      type: "source_component",
      source_component_id: "simple_soic4_0",
      name: "SOIC4",
      ftype: "simple_chip",
    },
    {
      type: "schematic_component",
      source_component_id: "simple_soic4_0",
      schematic_component_id: "schematic_component_simple_soic4_0",
      center: { x: 0, y: 0 },
      size: { width: 1, height: 1 },
      port_arrangement: {
        left_side: { pins: [1] },
        right_side: { pins: [4] },
        top_side: { pins: [2] },
        bottom_side: { pins: [3] },
      },
    },
    {
      type: "pcb_component",
      source_component_id: "simple_soic4_0",
      pcb_component_id: "pcb_component_simple_soic4_0",
      center: { x: 0, y: 0 },
      layer: "top",
      width: 5,
      height: 4,
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pcb_smtpad_simple_soic4_0_1",
      pcb_component_id: "pcb_component_simple_soic4_0",
      pcb_port_id: "pcb_port_simple_soic4_0_pin1",
      layer: "top",
      center: { x: -1.905, y: 1.27 },
      size: { width: 0.6, height: 2.2 },
      port_hints: ["1", "pin1"],
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pcb_smtpad_simple_soic4_0_2",
      pcb_component_id: "pcb_component_simple_soic4_0",
      pcb_port_id: "pcb_port_simple_soic4_0_pin2",
      layer: "top",
      center: { x: -1.905, y: -1.27 },
      size: { width: 0.6, height: 2.2 },
      port_hints: ["2", "pin2"],
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pcb_smtpad_simple_soic4_0_3",
      pcb_component_id: "pcb_component_simple_soic4_0",
      pcb_port_id: "pcb_port_simple_soic4_0_pin3",
      layer: "top",
      center: { x: 1.905, y: -1.27 },
      size: { width: 0.6, height: 2.2 },
      port_hints: ["3", "pin3"],
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pcb_smtpad_simple_soic4_0_4",
      pcb_component_id: "pcb_component_simple_soic4_0",
      pcb_port_id: "pcb_port_simple_soic4_0_pin4",
      layer: "top",
      center: { x: 1.905, y: 1.27 },
      size: { width: 0.6, height: 2.2 },
      port_hints: ["4", "pin4"],
    },
  ]
}

export function createCustomFootprintJson(): AnyCircuitElement[] {
  return [
    {
      type: "source_component",
      source_component_id: "custom_footprint_0",
      name: "CustomFootprint",
      ftype: "simple_chip",
    },
    {
      type: "pcb_component",
      source_component_id: "custom_footprint_0",
      pcb_component_id: "pcb_component_custom_footprint_0",
      center: { x: 0, y: 0 },
      layer: "top",
      width: 3,
      height: 2,
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pcb_smtpad_custom_footprint_0_A",
      pcb_component_id: "pcb_component_custom_footprint_0",
      pcb_port_id: "pcb_port_custom_footprint_0_A",
      layer: "top",
      center: { x: -1, y: 0 },
      size: { width: 0.8, height: 1.2 },
      port_hints: ["A", "pinA"],
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pcb_smtpad_custom_footprint_0_B",
      pcb_component_id: "pcb_component_custom_footprint_0",
      pcb_port_id: "pcb_port_custom_footprint_0_B",
      layer: "top",
      center: { x: 1, y: 0 },
      size: { width: 0.8, height: 1.2 },
      port_hints: ["B", "pinB"],
    },
  ]
}