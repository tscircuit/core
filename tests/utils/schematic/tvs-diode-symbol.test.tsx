import { expect, test } from "bun:test"
import { Circuit } from "lib/Circuit"

test("both <diode variant='tvs' /> and <diode tvs /> select the TVS/avalanche diode schematic symbol (#5570)", () => {
  const circuit = new Circuit()
  circuit.add(
    <board width={20} height={10}>
      <diode name="D_STANDARD" schX={-3} variant="standard" />
      <diode name="D_VARIANT" schX={-1} variant="tvs" />
      <diode name="D_FLAG" schX={1} tvs />
      <diode name="D_ZENER" schX={3} variant="zener" />
    </board>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()
  const getSymbolName = (name: string) => {
    const src = circuitJson.find(
      (el) => el.type === "source_component" && el.name === name,
    )
    const sch = circuitJson.find(
      (el) =>
        el.type === "schematic_component" &&
        el.source_component_id === src?.source_component_id,
    )
    return sch?.symbol_name
  }

  expect(getSymbolName("D_STANDARD")).toBe("diode_right")
  expect(getSymbolName("D_VARIANT")).toBe("avalanche_diode_right")
  expect(getSymbolName("D_FLAG")).toBe("avalanche_diode_right")
  expect(getSymbolName("D_ZENER")).toBe("zener_diode_right")
})