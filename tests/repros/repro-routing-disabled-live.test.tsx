import { expect, test } from "bun:test"
import { getPlatformConfig } from "@tscircuit/eval/platform-config"
import { Circuit } from "lib/RootCircuit"
import type { Chip } from "lib/components/normal-components/Chip"
import "tests/fixtures/extend-expect-circuit-snapshot"

const livePartsEngineTimeoutMs = 60_000

// Run separately from the offline suite: RUN_LIVE_PARTS_ENGINE_TESTS=1 bun test tests/repros/repro-routing-disabled-live.test.tsx
test.skipIf(process.env.RUN_LIVE_PARTS_ENGINE_TESTS !== "1")(
  "repro: real chip metadata starts routing despite routingDisabled",
  async () => {
    const circuit = new Circuit({ platform: getPlatformConfig() })
    circuit.add(
      <board width="24mm" height="14mm" routingDisabled>
        <chip
          name="U1"
          manufacturerPartNumber="SY8089AAAC"
          supplierPartNumbers={{ jlcpcb: ["C78988"] }}
          footprint="sot25_w2.6mm_pl1.1mm_pin1location(rightside,bottom)"
          pinLabels={{
            pin1: "EN",
            pin2: "GND",
            pin3: "LX",
            pin4: "IN",
            pin5: "FB",
          }}
          pinAttributes={{
            IN: { requiresPower: true },
            GND: { requiresGround: true },
          }}
          pcbX={-5}
          pcbRotation={180}
        />
        <capacitor name="C1" capacitance="10uF" footprint="0805" pcbX={5} />
        <trace name="VIN" from=".U1 > .IN" to=".C1 > .pin1" />
        <pcbnotetext pcbY={5} fontSize={0.7} text="routingDisabled = true" />
        <pcbnotetext
          pcbY={-5}
          fontSize={0.48}
          text="Expected: no copper between U1 and C1"
        />
      </board>,
    )
    await circuit.renderUntilSettled()

    const chip = circuit.selectOne(".U1") as Chip<string>
    expect(chip._fetchedSourcePortsForPinAttributes).toHaveLength(5)
    expect(circuit.db.source_trace.list()).toHaveLength(1)
    expect(circuit.db.pcb_trace.list()).toHaveLength(1)
    await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  },
  livePartsEngineTimeoutMs,
)
