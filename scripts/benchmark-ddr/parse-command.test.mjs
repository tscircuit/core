import { test } from "bun:test"
import assert from "node:assert/strict"
import { parseDdrBenchmarkCommand } from "./parse-command.mjs"

test("PR commands accept bounded options and reject shell syntax and command prefixes", () => {
  assert.deepEqual(parseDdrBenchmarkCommand("/benchmark"), { circuit: "", timeout: 120 })
  assert.deepEqual(parseDdrBenchmarkCommand("/benchmark --timeout 60 --circuit h3"), { circuit: "h3", timeout: 60 })
  for (const body of ["/benchmark-long", "/benchmark; echo x", "/benchmark --circuit ../core", "/benchmark --circuit $(id)", "/benchmark --timeout 0", "/benchmark --timeout 301", "/benchmark --timeout 1.5", "/benchmark --timeout", "/benchmark --core evil", "/benchmark --timeout 10 --timeout 20", "/benchmark --circuit h3 extra"]) assert.throws(() => parseDdrBenchmarkCommand(body), body)
})
