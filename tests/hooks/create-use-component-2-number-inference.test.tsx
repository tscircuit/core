import { test, expect } from "bun:test"
import { createUseComponent } from "lib/hooks/create-use-component"
import { type ResistorProps } from "@tscircuit/props"
import { expectTypesMatch } from "tests/fixtures/expect-types-match"

test("createUseComponent pin type inference", () => {
  const useResistor = createUseComponent(
    (props: ResistorProps) => <resistor {...props} />,
    {
      pin1: ["left"],
      pin2: ["right"],
    } as const,
  )

  const R1 = useResistor("R1", { resistance: "10k" })

  expectTypesMatch<typeof R1.left, string>(true)
  expectTypesMatch<typeof R1.pin1, string>(true)

  // @ts-expect-error
  expectTypesMatch<typeof R1.pin20, string>(true)
})
