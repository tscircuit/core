/**
 * Normalizes text for Circuit JSON by converting escaped newline sequences
 * to actual newline characters.
 *
 * In React/TSX, when users write text="Top\nLeft", React treats "\n" as two
 * literal characters (backslash + 'n') rather than a newline character.
 * This function converts those escaped sequences to proper unicode newlines.
 */
export function normalizeTextForCircuitJson(text: string): string {
  return text.replace(/\\n/g, "\n")
}
