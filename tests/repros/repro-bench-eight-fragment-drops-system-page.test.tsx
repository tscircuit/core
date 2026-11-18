import { beforeAll, expect, test } from "bun:test"
import { systemblock } from "lib"
import { convertCircuitJsonToSystemSvg } from "circuit-to-svg"
import { stackSvgsHorizontally, stackSvgsVertically } from "stack-svgs"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const pages = [
  <systemblock.page
    name="overview"
    displayName="Data and control"
    key="overview"
  >
    <systemblock.component name="adc" displayName="ADS1115" />
    <systemblock.component name="pico" displayName="Pico" />
    <systemblock.connection from="adc" to="pico" label="I2C" />
  </systemblock.page>,
  <systemblock.page name="power" displayName="Power paths" key="power">
    <systemblock.component name="usb" displayName="USB-C 5 V" />
    <systemblock.component name="ldo" displayName="AP2112 3.3 V" />
    <systemblock.connection from="usb" to="ldo" label="Power" kind="power" />
  </systemblock.page>,
]
const fragment = getTestFixture().circuit
const grouped = getTestFixture().circuit

beforeAll(async () => {
  // Both entries contain the same two pages from the Bench Eight overview.
  fragment.add(<>{pages}</>)
  grouped.add(<group>{pages}</group>)
  await fragment.renderUntilSettled()
  await grouped.renderUntilSettled()
  expect(grouped.db.system_block_page.list().map((p) => p.name)).toEqual([
    "overview",
    "power",
  ])

  const panels = [
    { circuit: grouped, label: "Group wrapper: both pages present" },
    { circuit: fragment, label: "Fragment wrapper: second page missing" },
  ].map(({ circuit, label }) =>
    stackSvgsVertically([
      `<svg xmlns="http://www.w3.org/2000/svg" width="650" height="45"><rect width="650" height="45" fill="white"/><text x="16" y="28" font-family="sans-serif" font-size="20">${label}</text></svg>`,
      ...circuit.db.system_block_page.list().map((page) =>
        convertCircuitJsonToSystemSvg(circuit.getCircuitJson(), {
          systemBlockPageId: page.system_block_page_id,
          width: 650,
        }),
      ),
    ]),
  )
  await expect(stackSvgsHorizontally(panels)).toMatchSvgSnapshot(
    import.meta.path,
  )
})

test.failing("a top-level fragment preserves both system diagram pages", () => {
  expect(fragment.db.system_block_page.list().map((p) => p.name)).toEqual([
    "overview",
    "power",
  ])
})
