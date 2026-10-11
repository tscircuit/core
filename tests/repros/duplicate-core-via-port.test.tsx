import { expect, test } from "bun:test"
import { mkdtemp, rm } from "node:fs/promises"
import { join } from "node:path"
import { Port } from "lib/components/primitive-components/Port"
import type { Via } from "lib/components/primitive-components/Via"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { captureRunEvidence } from "tests/fixtures/capture-run-evidence"

test.failing(
  "a via owns an inner-layer port supplied by a distinct core module",
  async () => {
    const directory = await mkdtemp(
      join(process.cwd(), "node_modules/.core-port-"),
    )
    try {
      const build = await Bun.build({
        entrypoints: [
          join(
            process.cwd(),
            "lib/components/primitive-components/Port/index.ts",
          ),
        ],
        target: "bun",
        packages: "external",
        outdir: directory,
      })
      expect(build.success).toBe(true)
      const { Port: ForeignPort } = (await import(build.outputs[0]!.path)) as {
        Port: typeof Port
      }
      expect(ForeignPort).not.toBe(Port)
      const inner = new ForeignPort({ name: "inner1", layer: "inner1" })
      expect(inner instanceof Port).toBe(false)
      const { circuit } = getTestFixture()
      circuit.add(
        <board
          width={8}
          height={6}
          layers={4}
          schematicDisabled
          routingDisabled
        >
          <via name="V1" outerDiameter={0.7} holeDiameter={0.3} />
        </board>,
      )
      const viaComponent = circuit.selectOne(".V1") as Via
      inner.registerMatch(viaComponent)
      viaComponent.add(inner)
      await circuit.renderUntilSettled()
      const via = circuit.db.pcb_via.list()[0]!
      const owned = circuit.db.pcb_port
        .list()
        .filter(
          (port) =>
            port.pcb_component_id ===
            circuit.db.pcb_port.get(inner.pcb_port_id!)?.pcb_component_id,
        )
      expect(owned).toHaveLength(3)
      expect(inner.pcb_port_id).toBeDefined()
      await captureRunEvidence(
        circuit.getCircuitJson(),
        `One through via: ${owned.length} owned layer ports; ${via.pcb_port_ids?.length ?? 0} attached. Expected 3.`,
      )
      expect(via.pcb_port_ids).toContain(inner.pcb_port_id!)
      expect(via.pcb_port_ids).toEqual(owned.map((port) => port.pcb_port_id))
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  },
)
