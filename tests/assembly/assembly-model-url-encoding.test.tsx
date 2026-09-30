import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("modelprinter strings remain a single encoded modelcdn path segment", () => {
  const { circuit } = getTestFixture()
  const model = "flexscreen_w20_h10_screencolor(#071c18)_text(A/B ?&+)"
  circuit.add(<assembly.device model={model} />)
  circuit.render()
  const cad = circuit.db.cad_component.list()[0]!
  const url = new URL(cad.model_glb_url!)
  expect(url.origin).toBe("https://modelcdn.tscircuit.com")
  expect(url.pathname).toBe(
    "/jscad_models/flexscreen_w20_h10_screencolor(%23071c18)_text(A%2FB%20%3F%26%2B).glb",
  )
  expect(url.search).toBe("")
  expect(url.hash).toBe("")
  const { circuit: disabled } = getTestFixture()
  disabled.pcbDisabled = true
  disabled.add(<assembly.device model="soic8" />)
  disabled.render()
  expect(disabled.db.cad_component.list()).toHaveLength(0)
})
