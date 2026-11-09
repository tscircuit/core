export function parseDdrBenchmarkCommand(body) {
  const tokens = body.trim().split(/\s+/)
  if (tokens.shift() !== "/benchmark") throw new Error("Expected /benchmark")
  let circuit = "",
    timeout = 120
  const seen = new Set()
  for (let i = 0; i < tokens.length; i += 2) {
    const option = tokens[i],
      value = tokens[i + 1]
    if (seen.has(option)) throw new Error(`Repeated option: ${option}`)
    seen.add(option)
    if (option === "--circuit" && /^[a-z][a-z0-9]*$/.test(value ?? ""))
      circuit = value
    else if (
      option === "--timeout" &&
      /^\d+$/.test(value ?? "") &&
      Number(value) >= 1 &&
      Number(value) <= 300
    )
      timeout = Number(value)
    else throw new Error("Usage: /benchmark [--circuit h3] [--timeout 120]")
  }
  return { circuit, timeout }
}
