import * as core from '@actions/core'

import { error, info, setFailed } from '@actions/core';

import { loadConfig, Config, lint, formatProblems } from '@redocly/openapi-core';

import {
  getExecutionTime,
  getFallbackEntryPointsOrExit,
  getTotals,
  printLintTotals,
} from '@redocly/openapi-cli/lib/utils';

import { Totals } from '@redocly/openapi-cli/lib/types';


async function run(): Promise<void> {
  try {
    const configFile: string = core.getInput('config_file')
    const config: Config = await loadConfig(configFile);
    const entrypoints = await getFallbackEntryPointsOrExit([], config);

    const totals: Totals = { errors: 0, warnings: 0, ignored: 0 };

    for (const entryPoint of entrypoints) {
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
          format: "codeframe",
          maxProblems: 100,
          totals: fileTotals,
          version: 'TODO',
        });

        const elapsed = getExecutionTime(startedAt);
        info(`${entryPoint}: validated in ${elapsed}\n\n`);
      } catch (e) {
        error(e.message);
      }
    }

    printLintTotals(totals, entrypoints.length);

    if (totals.errors > 0) {
      setFailed("Lint failed")
    }
  } catch (error) {
    setFailed(error.message)
  }
}

run()
