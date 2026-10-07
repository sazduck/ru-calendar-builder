#!/usr/bin/env node

import { run } from './cli';

function main() {
  run().catch((error) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    process.stderr.write(`\x1b[31mОшибка: ${errorMessage}\x1b[0m\n`);
    process.exit(1);
  });
}

main();
