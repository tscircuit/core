import { expect, test } from "bun:test"
import { parse } from "css-what"
import { getSvgSelectorSpecificity } from "lib/components/primitive-components/get-svg-selector-specificity"

const getSpecificity = (selectorText: string): number => {
  const selector = parse(selectorText)[0]
  if (!selector) throw new Error(`Could not parse selector: ${selectorText}`)
  return getSvgSelectorSpecificity(selector)
}

test("distinguishes ID shorthand from an ID attribute selector", () => {
  expect(getSpecificity("#line")).toBe(1_000_000)
  expect(getSpecificity('[id="line"]')).toBe(1_000)
  expect(getSpecificity(".outline.visible")).toBe(2_000)
})
