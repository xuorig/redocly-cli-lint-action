import { performance } from 'perf_hooks';
import { info, setFailed, getInput } from '@actions/core';
import { loadConfig, Config, lint, formatProblems } from '@redocly/openapi-core';

import {
  getExecutionTime,
  getFallbackEntryPointsOrExit,
  getTotals,
  printLintTotals,
} from '@redocly/openapi-cli/lib/utils';

import { Totals } from '@redocly/openapi-cli/lib/types';

type ErrorFormat = "codeframe" | "stylish" | "json" | undefined;

async function run(): Promise<void> {
  try {
    const configFile: string = getInput('config')
    const config: Config = await loadConfig(configFile);

    let entryPoints: string[] = [];
    const entryPointInput: string = getInput('entrypoints')
    if (entryPointInput) {
      entryPoints = entryPointInput.split(" ")
    }

    entryPoints = await getFallbackEntryPointsOrExit(entryPoints, config);

    const format = getInput('format') as ErrorFormat;

    let maxProblems: number = parseInt(getInput('max_problems'));
    if (isNaN(maxProblems)) {
      maxProblems = 100;
    }

    const totals: Totals = { errors: 0, warnings: 0, ignored: 0 };

    for (const entryPoint of entryPoints) {
      try {
        const startedAt = performance.now();
        info(`validating ${entryPoint}...\n`);

        const results = await lint({
          ref: entryPoint,
          config,
        });

        const fileTotals = getTotals(results);
        totals.errors += fileTotals.errors;
        totals.warnings += fileTotals.warnings;
        totals.ignored += fileTotals.ignored;

        formatProblems(results, {
          format,
          maxProblems,
          totals: fileTotals,
          version: '0.0.1',
        });

        const elapsed = getExecutionTime(startedAt);
        info(`${entryPoint}: validated in ${elapsed}\n\n`);
      } catch (e) {
        setFailed(e.message);
      }
    }

    printLintTotals(totals, entryPoints.length);

    if (totals.errors > 0) {
      setFailed("Lint failed")
    }
  } catch (error) {
    setFailed(error.message)
  }
}

run()
