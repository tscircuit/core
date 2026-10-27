// tsup cannot emit declarations for a source-only package under node_modules.
// Generate local declarations first, then bundle them through dts.compilerOptions.paths.
const sources = [
  ...new Bun.Glob("**/*.ts").scanSync({
    cwd: "node_modules/@tscircuit/test-point-rerouter/lib",
    absolute: true,
  }),
]
const result = Bun.spawnSync(
  [
    "bunx",
    "tsc",
    ...sources,
    "--declaration",
    "--emitDeclarationOnly",
    "--skipLibCheck",
    "--moduleResolution",
    "bundler",
    "--module",
    "esnext",
    "--target",
    "esnext",
    "--outDir",
    ".build/test-point-rerouter",
  ],
  { stdout: "inherit", stderr: "inherit" },
)
if (result.exitCode !== 0) process.exit(result.exitCode)
