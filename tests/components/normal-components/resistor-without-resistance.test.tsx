import { test, expect } from "bun:test"
import { InvalidProps } from "lib/errors/InvalidProps"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { ZodError } from "zod"

test("resistor without resistance throws well-formed error", () => {
  const { project } = getTestFixture()

  try {
    project.add(
      <board width="10mm" height="10mm">
        {/* @ts-ignore */}
        <resistor name="R1" footprint="0402" />
      </board>,
    )

    throw new Error(
      "Should not be able to render circuit where resistor has no resistance",
    )
  } catch (e: unknown) {
    expect(e).toBeInstanceOf(InvalidProps)
    expect((e as InvalidProps).message).toContain("R1")
    expect((e as InvalidProps).message).toContain("resistance")
  }
})
