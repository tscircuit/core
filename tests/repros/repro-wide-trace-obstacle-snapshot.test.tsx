import { expect, test } from "bun:test"
import { getObstaclesFromCircuitJson } from "lib/utils/obstacles/getObstaclesFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { PrintedCoilSensor } from "./fixtures/wide-trace-obstacle/printed-coil-sensor"

test("printed sensing coil copper extends beyond its routing obstacles", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<PrintedCoilSensor />)
  await circuit.renderUntilSettled()
  const coil = circuit.selectOne(".L1")!
  const coilTrace = circuit.db.pcb_trace
    .list()
    .find((trace) => trace.pcb_component_id === coil.pcb_component_id)!
  const obstacles = getObstaclesFromCircuitJson([coilTrace])
  const board = circuit.firstChild!
  // PCB-world points in mm: +X right, +Y up, right-handed frame.
  // PCB notes use this same frame; no transform is needed.
  for (const obstacle of obstacles) {
    board.add(
      <pcbnoterect
        pcbX={obstacle.center.x}
        pcbY={obstacle.center.y}
        width={obstacle.width}
        height={obstacle.height}
        strokeWidth={0.025}
        color="#00ff88"
      />,
    )
  }
  board.add(
    <pcbnotetext
      pcbY={-8}
      fontSize={0.55}
      color="#00ff88"
      text={`Green: generated obstacles, ${obstacles[0].width} mm wide`}
    />,
  )
  await circuit.renderUntilSettled()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
