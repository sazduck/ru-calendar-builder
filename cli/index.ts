#!/usr/bin/env node

import { run } from "@/index";

await run(process.stdin, process.stdout, process.stderr)
