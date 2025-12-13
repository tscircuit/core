
import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { communityLibrary } from "lib/utils/boards/board-templates"


test("Community templates > should support raspberrypihat", async () => {
  const { circuit } = getTestFixture({
    platform: {
      footprintLibraryMap: {
        // @ts-ignore
        community: async (name) => {
          return communityLibrary.getTemplate(name)
        }
      }
    }
  })

  circuit.add(
    <board template="community:raspberrypihat" />
  )

  // Initial render
  circuit.render()

  // Allow async template load
  await new Promise(r => setTimeout(r, 200))

  // Re-render to apply
  circuit.render()

  const json = await circuit.getCircuitJson()
  const boardJson = json.find((elm) => elm.type === "pcb_board")

  expect(boardJson?.width).toBe(65)
  expect(boardJson?.height).toBe(56)
  expect(boardJson?.outline).toBeDefined()
  expect(boardJson?.outline?.length).toBe(4)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
