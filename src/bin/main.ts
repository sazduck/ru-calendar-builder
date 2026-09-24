#!/usr/bin/env node

import { parseArgs } from 'node:util';
import { run } from './runner';
import { createReadStream } from 'node:fs';

function printHelp(w: NodeJS.WritableStream) {
  w.write(`
Использование:
  ru-cal [путь_к_файлу] [опции]
  cat data.txt | ru-cal [опции]

Аргументы:
  [путь_к_файлу]        Необязательный путь к текстовому файлу с переносами.
                        Если не указан, данные читаются из стандартного ввода (stdin).

Опции:
  -p, --parser-only     Запустить только парсер (выведет сырую структуру переносов)
  -f, --format          Форматировать вывод JSON (с отступами в 2 пробела)
  -h, --help            Показать эту справку
  `);
}

async function main() {
  try {
    const { values, positionals } = parseArgs({
      options: {
        'parser-only': { type: 'boolean', short: 'p' },
        format: { type: 'boolean', short: 'f' },
        help: { type: 'boolean', short: 'h' },
      },
      strict: true,
      allowPositionals: true,
    });

    if (values.help) {
      printHelp(process.stdout);
      process.exit(0);
    }

    let inputStream: NodeJS.ReadableStream;

    if (positionals && positionals.length > 0) {
      const filePath = positionals[0];
      if (!filePath) {
        throw new Error('Путь к файлу не может быть пустым');
      }
      inputStream = createReadStream(filePath);
    } else {
      if (process.stdin.isTTY) {
        printHelp(process.stdout);
        process.exit(1);
      }
      inputStream = process.stdin;
    }

    await run(inputStream, process.stdout, {
      parserOnly: !!values['parser-only'],
      format: !!values.format,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Ошибка: ${errorMessage}\n`);
    process.exit(1);
  }
}

main();
