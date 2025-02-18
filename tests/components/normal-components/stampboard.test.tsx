import { it, expect, describe } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("should render a default stampboard and have the correct config", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <stampboard name="S1" />
    </board>,
  )
  circuit.render()

  const stampboardInstance = circuit.selectOne("Stampboard")
  expect(stampboardInstance).not.toBeNull()
  expect(stampboardInstance!.config.componentName).toBe("Stampboard")
})

it("should render a stampboard with custom properties", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <stampboard
        name="S2"
        leftPinCount={4}
        rightPinCount={4}
        topPins={["TP1", "TP2"]}
        bottomPins={["BP1", "BP2"]}
        pinPitch="2mm"
        innerHoles={true}
      />
    </board>,
  )
  circuit.render()

  const stampboardInstance = circuit.selectOne("Stampboard")
  expect(stampboardInstance).not.toBeNull()
  const props = stampboardInstance!._parsedProps as any
  expect(props.leftPinCount).toBe(4)
  expect(props.rightPinCount).toBe(4)
  expect(props.topPins).toEqual(["TP1", "TP2"])
  expect(props.bottomPins).toEqual(["BP1", "BP2"])
  expect(props.pinPitch).toBe(2)
  expect(props.innerHoles).toBe(true)
})
