#!/usr/bin/env node

import { parseArgs } from 'node:util';
import { run } from './runner';
import { createReadStream } from 'node:fs';
import type { Readable } from 'stream';

function printHelp(w: NodeJS.WritableStream) {
  w.write(`
Использование:
  ru-cal [путь_к_файлу] [опции]
  cat data.txt | ru-cal [опции]

Аргументы:
  [путь_к_файлу]          Необязательный путь к текстовому файлу с переносами.
                          Если не указан, данные читаются из стандартного ввода (stdin).

Опции:
  -p, --parser-only       Запустить только парсер (выведет сырую структуру переносов)
  -j, --json              Входные данные - JSON с transfers (вместо текстового формата)
  -f, --format            Форматировать вывод JSON (с отступами в 2 пробела)
  -r, --with-reason-only  Выводить только нетепичные дни (праздники/переносы/сокращенные)
  -h, --help              Показать эту справку
  -l, --get-link <year>   Сформировать ссылку на сайт правительства РФ с текстом переносов
  `);
}

const ARGS_CONFIG = {
  options: {
    'parser-only': { type: 'boolean', short: 'p' },
    'with-reason-only': { type: 'boolean', short: 'r' },
    json: { type: 'boolean', short: 'j' },
    format: { type: 'boolean', short: 'f' },
    help: { type: 'boolean', short: 'h' },
    'get-link': { type: 'string', short: 'l' },
  },

  strict: true,
  allowPositionals: true,
} as const;

async function main() {
  try {
    const { values, positionals } = parseArgs(ARGS_CONFIG);

    if (values.help) {
      printHelp(process.stdout);
      process.exit(0);
    }

    let inputStream: Readable;

    if (positionals && positionals.length > 0) {
      const filePath = positionals[0];
      if (!filePath) {
        throw new Error('Путь к файлу не может быть пустым');
      }
      inputStream = createReadStream(filePath);
    } else {
      if (process.stdin.isTTY && !values['get-link']) {
        printHelp(process.stdout);
        process.exit(1);
      }
      inputStream = process.stdin;
    }

    await run(inputStream, process.stdout, {
      parserOnly: values['parser-only'],
      format: values.format,
      withReasonOnly: values['with-reason-only'],
      json: values.json,
      getLink:
        values['get-link'] !== undefined ?
          Number(values['get-link'])
        : undefined,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    process.stderr.write(`\x1b[31mОшибка: ${errorMessage}\x1b[0m\n`);
    process.exit(1);
  }
}

main();
