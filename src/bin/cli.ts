import { parseArgs } from 'node:util';
import { createReadStream } from 'node:fs';
import { execute } from './runner';

function printHelp(w: NodeJS.WritableStream) {
  w.write(`
Использование:
  ru-cal [путь_к_файлу] [опции]
  cat data.txt | ru-cal [опции]

Аргументы:
  [путь_к_файлу]          Необязательный путь к текстовому файлу с переносами.
                          Если не указан, данные читаются из стандартного ввода (stdin).

Опции:
  -t, --trasnfers-only    Запустить только парсер (выведет сырую структуру переносов)
  -i, --input-transfers   Входные данные - JSON с transfers (вместо текстового формата)
  -p, --pretty            Форматировать вывод JSON (с отступами в 2 пробела)
  -s, --special-only      Выводить только особые дни (праздники/переносы/сокращенные)
  -h, --help              Показать эту справку
  -l, --get-link <year>   Сформировать ссылку на сайт правительства РФ с текстом переносов
  `);
}

const ARGS_CONFIG = {
  options: {
    'transfers-only': { type: 'boolean', short: 't' },
    'special-only': { type: 'boolean', short: 's' },
    'input-transfers': { type: 'boolean', short: 'i' },
    pretty: { type: 'boolean', short: 'p' },
    help: { type: 'boolean', short: 'h' },
    'get-link': { type: 'string', short: 'l' },
  },

  strict: true,
  allowPositionals: true,
} as const;

export async function run() {
  const { values, positionals } = parseArgs(ARGS_CONFIG);

  if (values.help) {
    printHelp(process.stdout);
    process.exit(0);
  }

  const filePath = positionals[0];
  if (!filePath && process.stdin.isTTY && !values['get-link']) {
    printHelp(process.stdout);
    process.exit(1);
  }

  const inputStream = filePath ? createReadStream(filePath) : process.stdin;

  await execute(inputStream, process.stdout, {
    transfersOnly: values['transfers-only'],
    pretty: values.pretty,
    specialOnly: values['special-only'],
    inputTransfers: values['input-transfers'],
    getLink:
      values['get-link'] !== undefined ? Number(values['get-link']) : undefined,
  });
}
