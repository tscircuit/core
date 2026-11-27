import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { Port } from "lib/components/primitive-components/Port"
import { Via } from "lib/components/primitive-components/Via"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import Board from "./source/board.circuit"
import { displayLinks } from "./source/product/display-routing"
import upstream from "./upstream.json"

export function verifyUsbCEpaperSource() {
  for (const [path, expected] of Object.entries(upstream.source_files_sha256)) {
    const content = readFileSync(new URL(`./source/${path}`, import.meta.url))
    const actual = createHash("sha256").update(content).digest("hex")
    if (actual !== expected)
      throw new Error(`Upstream board fixture changed: ${path}`)
  }
}

export async function getUsbCEpaperViaPortFixture() {
  const { circuit } = getTestFixture({
    platform: { routingDisabled: true, partsEngineDisabled: true },
  })
  circuit.schematicDisabled = true
  circuit.add(<Board />)

  let renderError: string | null = null
  try {
    await circuit.renderUntilSettled()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (
      message !==
      'Could not find source trace for trace name or port selector "DISPLAY_BUSY" in bus "DISPLAY_INTERCONNECT"'
    ) {
      throw error
    }
    renderError = message
  }

  // The source bus error occurs before PCB rendering. Read the partial database
  // directly: getCircuitJson() would retry the failed render.
  const data = circuit.db.toArray()
  const vias = circuit
    .selectAll("via")
    .filter((via): via is Via => via instanceof Via)
  const viaPorts = vias.map((via) => {
    const ports = via.children
      .filter((child): child is Port => child instanceof Port)
      .map((port) => circuit.db.source_port.get(port.source_port_id!)!)
    return {
      name: via.name!,
      position: via._getGlobalPcbPositionBeforeLayout(),
      expectedLayers: via.getAvailablePcbLayers(),
      sourcePorts: ports,
    }
  })
  const displayEndpoints = displayLinks.flatMap((link) => [
    `${link.name}_FROM_VIA`,
    `${link.name}_TO_VIA`,
  ])
  return { circuit, data, viaPorts, displayEndpoints, renderError }
}

export type UsbCEpaperViaPortFixture = Awaited<
  ReturnType<typeof getUsbCEpaperViaPortFixture>
>
