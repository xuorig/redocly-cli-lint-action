"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const perf_hooks_1 = require("perf_hooks");
const core_1 = require("@actions/core");
const openapi_core_1 = require("@redocly/openapi-core");
const utils_1 = require("@redocly/openapi-cli/lib/utils");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const configFile = core_1.getInput('config');
            const config = yield openapi_core_1.loadConfig(configFile);
            let entryPoints = [];
            const entryPointInput = core_1.getInput('entrypoints');
            if (entryPointInput) {
                entryPoints = entryPointInput.split(" ");
            }
            entryPoints = yield utils_1.getFallbackEntryPointsOrExit(entryPoints, config);
            const format = core_1.getInput('format');
            let maxProblems = parseInt(core_1.getInput('max_problems'));
            if (isNaN(maxProblems)) {
                maxProblems = 100;
            }
            const totals = { errors: 0, warnings: 0, ignored: 0 };
            for (const entryPoint of entryPoints) {
                try {
                    const startedAt = perf_hooks_1.performance.now();
                    core_1.info(`validating ${entryPoint}...\n`);
                    const results = yield openapi_core_1.lint({
                        ref: entryPoint,
                        config,
                    });
                    const fileTotals = utils_1.getTotals(results);
                    totals.errors += fileTotals.errors;
                    totals.warnings += fileTotals.warnings;
                    totals.ignored += fileTotals.ignored;
                    openapi_core_1.formatProblems(results, {
                        format: format,
                        maxProblems: maxProblems,
                        totals: fileTotals,
                        version: '0.0.1',
                    });
                    const elapsed = utils_1.getExecutionTime(startedAt);
                    core_1.info(`${entryPoint}: validated in ${elapsed}\n\n`);
                }
                catch (e) {
                    core_1.setFailed(e.message);
                }
            }
            utils_1.printLintTotals(totals, entryPoints.length);
            if (totals.errors > 0) {
                core_1.setFailed("Lint failed");
            }
        }
        catch (error) {
            core_1.setFailed(error.message);
        }
    });
}
run();
