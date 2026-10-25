const [base, head] = await Promise.all(
  Bun.argv.slice(2).map(async (path) => Bun.file(path).json()),
)
for (let i = 0; i < 2; i++) {
  const before = base.cases[i],
    after = head.cases[i]
  if (
    before.routeSha256 !== after.routeSha256 ||
    after.completedTraces !== 1 ||
    after.errors.length ||
    !after.repeatedGraphicsReadsStable
  )
    throw new Error("Native route or graphics consumer regression")
  if (after.previewCalls !== (after.consumeGraphics ? after.progressEvents : 0))
    throw new Error("Unused or repeated progress preview computation")
}
console.log(JSON.stringify({ base, head }, null, 2))
