import { it, expect } from "bun:test"
import { getTestFixture } from "./get-test-fixture"

const urls = [
  "https://registry-api.tscircuit.com/test",
  "https://api.tscircuit.com/test",
  "https://jlcsearch.tscircuit.com/test",
]

for (const url of urls) {
  it(`blocks fetch to ${url}`, async () => {
    getTestFixture()
    await expect(fetch(url)).rejects.toThrow(/not allowed/)
  })
}
