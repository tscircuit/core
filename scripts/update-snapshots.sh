#!/usr/bin/env bash

set -euo pipefail

timeout_ms="${BUN_TEST_TIMEOUT_MS:-120000}"
node_count="${BUN_TEST_PLAN_NODE_COUNT:-4}"
test_pattern="${TEST_PATTERN:-}"

run_bun_test() {
  BUN_UPDATE_SNAPSHOTS=1 bun test --update-snapshots "$@" --timeout "$timeout_ms"
}

expand_test_args() {
  local arg
  local expanded_args=()

  shopt -s globstar nullglob

  for arg in "$@"; do
    if [[ "$arg" == *"{"* || "$arg" == *"}"* ]]; then
      echo "ERROR: Brace patterns are not supported: $arg" >&2
      echo "Pass separate patterns instead, for example tests/**/*.test.ts tests/**/*.test.tsx" >&2
      return 2
    fi

    if [[ "$arg" == *"*"* || "$arg" == *"?"* || "$arg" == *"["* ]]; then
      local matches=( $arg )
      if [ "${#matches[@]}" -eq 0 ]; then
        echo "ERROR: Pattern did not match any files: $arg" >&2
        return 2
      fi
      expanded_args+=("${matches[@]}")
    else
      if [ ! -f "$arg" ]; then
        echo "ERROR: Test file does not exist: $arg" >&2
        return 2
      fi
      expanded_args+=("$arg")
    fi
  done

  printf "%s\n" "${expanded_args[@]}"
}

run_with_retries() {
  local attempt=1
  local code=0

  while [ "$attempt" -le 4 ]; do
    set +e
    run_bun_test "$@"
    code=$?
    set -e

    if [ "$code" -eq 0 ]; then
      return 0
    fi

    if [ "$code" -ne 139 ] && [ "$code" -ne 132 ]; then
      return "$code"
    fi

    if [ "$attempt" -eq 4 ]; then
      echo "Segmentation fault or illegal instruction detected after $attempt attempts (exit=$code)."
      return "$code"
    fi

    attempt=$((attempt + 1))
    echo "Segfault (139) or illegal instruction (132) detected, retrying ($attempt/4)..."
  done
}

if [ "$#" -gt 0 ]; then
  echo "Updating snapshots for explicit test files/patterns: $*"
  expanded_output="$(expand_test_args "$@")"
  mapfile -t test_files <<< "$expanded_output"
  run_with_retries "${test_files[@]}"
  exit $?
fi

if [ -n "$test_pattern" ]; then
  echo "Updating snapshots for TEST_PATTERN: $test_pattern"
  read -r -a test_patterns <<< "$test_pattern"
  expanded_output="$(expand_test_args "${test_patterns[@]}")"
  mapfile -t test_files <<< "$expanded_output"
  run_with_retries "${test_files[@]}"
  exit $?
fi

if [[ ! "$node_count" =~ ^[1-9][0-9]*$ ]]; then
  echo "ERROR: BUN_TEST_PLAN_NODE_COUNT must be a positive integer, got: $node_count" >&2
  exit 2
fi

bun run scripts/generate-test-plan.ts

for node in $(seq 1 "$node_count"); do
  plan_file=".github/test-plans/node${node}-testplan.txt"
  if [ ! -f "$plan_file" ]; then
    echo "ERROR: No test plan found for node ${node}"
    exit 1
  fi

  mapfile -t test_files < "$plan_file"
  if [ "${#test_files[@]}" -eq 0 ]; then
    echo "ERROR: No test files in plan for node ${node}"
    exit 1
  fi

  echo "Updating snapshots for ${#test_files[@]} test files from node ${node}"
  run_with_retries "${test_files[@]}"
done
