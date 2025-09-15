# Writing Tests

This is the basic template for any test:

```tsx
import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("my test name", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="10mm">
      {/*
        add components here e.g.
        <chip
          name="U1"
          footprint="soic8"
          pinLabels={{ pin1: "PWR", pin8: "GND" }}
          pcbX={0}
          pcbY={0}
        />
      */}
    </board>
  )

  circuit.render()

  // optional: add expect statements that query against classes
  // expect(circuit.selectAll("trace").length).toBe(7)

  // optional: add expect statements here to check for expected values
  // expect(circuit.db.pcb_smtpad.list().map((smtpad) => smtpad.pcb_port_id)).not.toContain(null)
  // expect(circuit.db.pcb_plated_hole.list()[0].hole_diameter).toBe(0.4)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
```

After running the test the first time, an svg snapshot will be created.
