import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("silkscreen text preserves explicit mirroring through layer flips", () => {
  const { circuit } = getTestFixture()
  const mirrors = [true, false, undefined]
  circuit.add(
    <board width={60} height={25}>
      {(["top", "bottom"] as const).flatMap((layer, row) =>
        mirrors.map((mirrored, i) => (
          <chip
            key={`U${row}_${i}`}
            name={`U${row}_${i}`}
            layer={layer}
            pcbX={-20 + i * 20}
            pcbY={row ? -6 : 6}
            footprint={
              <footprint>
                <silkscreentext
                  text={`ABC ${String(mirrored)}`}
                  mirrored={mirrored}
                  fontSize={1}
                />
              </footprint>
            }
          />
        )),
      )}
    </board>,
  )
  circuit.render()
  const texts = circuit.db.pcb_silkscreen_text
    .list()
    .filter((t) => t.text.startsWith("ABC"))
  expect(texts).toHaveLength(6)
  texts.forEach((text, i) => {
    expect(text.is_mirrored).toBe(mirrors[i % 3])
    if (mirrors[i % 3] === undefined)
      expect(text).not.toHaveProperty("is_mirrored")
    expect(text.layer).toBe(i < 3 ? "top" : "bottom")
  })
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
