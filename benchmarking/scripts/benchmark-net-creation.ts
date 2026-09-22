import { Board, Chip, Net, Port } from "lib"
import { createNetsFromProps } from "lib/utils/components/createNetsFromProps"

// Isolate the cold net lookups seen in large imported boards. Tree construction
// is excluded; each strategy starts with a fresh tree and empty selector caches.
const measure = (indexed: boolean) => {
  const board = new Board({ width: 100, height: 100 })
  for (let i = 0; i < 1500; i++) {
    const chip = new Chip({ name: `U${i}` })
    for (let pin = 1; pin <= 10; pin++) {
      chip.add(new Port({ name: `pin${pin}` }))
    }
    board.add(chip)
  }
  const nets = Array.from(
    { length: 1000 },
    (_, i) => new Net({ name: `N${i}` }),
  )
  board.addAll(nets)
  const selectors = nets.map((net) => `net.${net.name}`)
  const start = performance.now()
  for (const selector of selectors) {
    if (indexed) {
      createNetsFromProps(board, [selector])
    } else if (!board.selectOne(selector)) {
      // Previous implementation, for the valid literal selectors in this fixture.
      board.add(new Net({ name: selector.slice(4) }))
    }
  }
  const elapsedMs = performance.now() - start
  const actualNets = board.selectAll("net")
  if (
    actualNets.length !== nets.length ||
    actualNets.some((net, i) => net !== nets[i])
  ) {
    throw new Error("Net creation changed the existing nets")
  }
  return elapsedMs
}

const cssLookupMs = measure(false)
const indexedLookupMs = measure(true)
console.log(
  JSON.stringify(
    { cssLookupMs, indexedLookupMs, speedup: cssLookupMs / indexedLookupMs },
    null,
    2,
  ),
)
