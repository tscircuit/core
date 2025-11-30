export interface EvaluateCalcOptions {
  knownVariables: Record<string, number>
  /**
   * Optional unit multipliers relative to "mm".
   * Example: { mm: 1, cm: 10, in: 25.4 }
   */
  units?: Record<string, number>
}

type NumberToken = {
  type: "number"
  value: number
}

type StringToken = {
  type: "identifier" | "operator" | "paren"
  value: string
}

type Token = NumberToken | StringToken

const defaultUnits: Record<string, number> = {
  mm: 1,
  // You can add more if you need them:
  // cm: 10,
  // in: 25.4,
  // mil: 0.0254,
}

export function evaluateCalcString(
  input: string,
  options: EvaluateCalcOptions,
): number {
  const { knownVariables, units: userUnits } = options
  const units = { ...defaultUnits, ...(userUnits ?? {}) }

  const expr = extractExpression(input)
  const tokens = tokenize(expr, units)
  const result = parseExpression(tokens, knownVariables)

  return result
}

/**
 * Strip the outer calc(...) if present and return the inner expression.
 */
function extractExpression(raw: string): string {
  const trimmed = raw.trim()

  if (!trimmed.toLowerCase().startsWith("calc")) {
    // Not a calc() wrapper, treat as a plain expression
    return trimmed
  }

  const match = trimmed.match(/^calc\s*\((.*)\)$/is)
  if (!match) {
    throw new Error(`Invalid calc() expression: "${raw}"`)
  }
  return match[1].trim()
}

/**
 * Tokenizer: turns "board.minx + 1mm" into tokens.
 */
function tokenize(expr: string, units: Record<string, number>): Token[] {
  const tokens: Token[] = []
  let i = 0

  const isDigit = (ch: string) => ch >= "0" && ch <= "9"
  const isIdentStart = (ch: string) =>
    (ch >= "A" && ch <= "Z") || (ch >= "a" && ch <= "z") || ch === "_"
  const isIdentChar = (ch: string) =>
    isIdentStart(ch) || isDigit(ch) || ch === "."

  while (i < expr.length) {
    const ch = expr[i]

    // Whitespace -> skip
    if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
      i++
      continue
    }

    // Number (possibly with unit like "mm")
    if (
      isDigit(ch) ||
      (ch === "." && i + 1 < expr.length && isDigit(expr[i + 1]))
    ) {
      const start = i
      i++ // consume first char

      // digits and decimal points
      while (i < expr.length) {
        const c = expr[i]
        if (isDigit(c) || c === ".") {
          i++
        } else {
          break
        }
      }

      const numberText = expr.slice(start, i)
      let num = Number(numberText)
      if (Number.isNaN(num)) {
        throw new Error(`Invalid number: "${numberText}"`)
      }

      // Optional unit directly after number (e.g. "1mm")
      const unitStart = i
      while (i < expr.length && /[A-Za-z]/.test(expr[i])) {
        i++
      }
      if (i > unitStart) {
        const unitText = expr.slice(unitStart, i)
        const factor = units[unitText]
        if (factor == null) {
          throw new Error(`Unknown unit: "${unitText}"`)
        }
        num *= factor
      }

      tokens.push({ type: "number", value: num })
      continue
    }

    // Identifier: board.minx, foo, x1, etc.
    if (isIdentStart(ch)) {
      const start = i
      i++
      while (i < expr.length && isIdentChar(expr[i])) {
        i++
      }
      const ident = expr.slice(start, i)
      tokens.push({ type: "identifier", value: ident })
      continue
    }

    // Parentheses
    if (ch === "(" || ch === ")") {
      tokens.push({ type: "paren", value: ch })
      i++
      continue
    }

    // Operators
    if (ch === "+" || ch === "-" || ch === "*" || ch === "/") {
      tokens.push({ type: "operator", value: ch })
      i++
      continue
    }

    throw new Error(`Unexpected character "${ch}" in expression "${expr}"`)
  }

  return tokens
}

/**
 * Recursive‑descent parser / evaluator
 * Grammar:
 *   expression := term (("+" | "-") term)*
 *   term       := factor (("*" | "/") factor)*
 *   factor     := ("+" | "-") factor | primary
 *   primary    := NUMBER | IDENTIFIER | "(" expression ")"
 */
function parseExpression(
  tokens: Token[],
  vars: Record<string, number>,
): number {
  let index = 0

  const peek = (): Token | undefined => tokens[index]
  const consume = (): Token => tokens[index++]

  const parsePrimary = (): number => {
    const token = peek()
    if (!token) {
      throw new Error("Unexpected end of expression")
    }

    if (token.type === "number") {
      consume()
      return token.value
    }

    if (token.type === "identifier") {
      consume()
      const value = vars[token.value]
      if (value == null) {
        throw new Error(`Unknown variable: "${token.value}"`)
      }
      return value
    }

    if (token.type === "paren" && token.value === "(") {
      consume() // "("
      const value = parseExpr()
      const next = peek()
      if (!next || next.type !== "paren" || next.value !== ")") {
        throw new Error('Expected ")"')
      }
      consume() // ")"
      return value
    }

    throw new Error(`Unexpected token "${(token as any).value}"`)
  }

  const parseFactor = (): number => {
    const token = peek()
    if (
      token &&
      token.type === "operator" &&
      (token.value === "+" || token.value === "-")
    ) {
      // Unary +/−
      consume()
      const value = parseFactor()
      return token.value === "+" ? value : -value
    }
    return parsePrimary()
  }

  const parseTerm = (): number => {
    let value = parseFactor()
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const token = peek()
      if (!token || token.type !== "operator") break
      if (token.value !== "*" && token.value !== "/") break

      consume()
      const rhs = parseFactor()
      if (token.value === "*") {
        value *= rhs
      } else {
        value /= rhs
      }
    }
    return value
  }

  const parseExpr = (): number => {
    let value = parseTerm()
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const token = peek()
      if (!token || token.type !== "operator") break
      if (token.value !== "+" && token.value !== "-") break

      consume()
      const rhs = parseTerm()
      if (token.value === "+") {
        value += rhs
      } else {
        value -= rhs
      }
    }
    return value
  }

  const result = parseExpr()

  if (index < tokens.length) {
    const leftover = tokens
      .slice(index)
      .map((t) => ("value" in t ? (t as any).value : "?"))
      .join(" ")
    throw new Error(`Unexpected tokens at end of expression: ${leftover}`)
  }

  return result
}
