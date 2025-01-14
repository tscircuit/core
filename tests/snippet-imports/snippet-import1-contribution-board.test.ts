import { test, expect } from "bun:test"
import { importSnippet } from "@tscircuit/import-snippet"

test("snippet-import1-contribution-board", async () => {
  const ContributionBoard = await importSnippet(
    "tests/snippet-imports/contribution-board.ts",
  )

  expect(ContributionBoard).toBeDefined()
})
