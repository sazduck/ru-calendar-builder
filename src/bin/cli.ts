import { once } from 'node:events';
import { createReadStream, createWriteStream } from 'node:fs';
import { finished } from 'node:stream/promises';
import { parseArgs } from 'node:util';
import {
  execute,
  type OutputFormat,
  type OutputMode,
  type RunConfig,
} from './runner';

interface ParsedCli {
  config: RunConfig;
  inputFile?: string | undefined;
  outputFile?: string | undefined;
}

export async function run(
  rawArgs: string[] = process.argv.slice(2),
): Promise<void> {
  const { config, inputFile, outputFile } = parseCliArgs(rawArgs);

  let reader: NodeJS.ReadableStream = process.stdin;
  if (inputFile) {
    const fileStream = createReadStream(inputFile, { encoding: 'utf8' });
    await once(fileStream, 'open');
    reader = fileStream;
  }

  let writer: NodeJS.WritableStream = process.stdout;
  if (outputFile) {
    const fileStream = createWriteStream(outputFile, { encoding: 'utf8' });
    await once(fileStream, 'open');
    writer = fileStream;
  }

  try {
    await execute(reader, writer, config);
  } finally {
    if (outputFile) {
      writer.end();
      await finished(writer);
    }
    if (
      inputFile &&
      'destroy' in reader &&
      typeof reader.destroy === 'function'
    ) {
      reader.destroy();
    }
  }
}

function parseCliArgs(rawArgs: string[]): ParsedCli {
  const { tokens } = parseArgs({
    args: rawArgs,
    strict: false,
    allowPositionals: true,
    tokens: true,
    options: {
      output: { type: 'string', short: 'o' },
    },
  });

  const firstPositional = tokens.find(t => t.kind === 'positional');
  const subcommands = new Set(['link', 'l', 'parse', 'help']);

  let command = 'parse';
  let commandArgs = rawArgs;

  if (firstPositional && subcommands.has(firstPositional.value)) {
    command = firstPositional.value === 'l' ? 'link' : firstPositional.value;
    commandArgs = [
      ...rawArgs.slice(0, firstPositional.index),
      ...rawArgs.slice(firstPositional.index + 1),
    ];
  }

  if (command === 'help') {
    printHelp(commandArgs[0]);
    process.exit(0);
  }

  if (command === 'link') {
    const { values, positionals } = parseArgs({
      args: commandArgs,
      allowPositionals: true,
      options: {
        help: { type: 'boolean', short: 'h', default: false },
      },
    });

    if (values.help) {
      printHelp('link');
      process.exit(0);
    }

    const rawYear = positionals;
    if (!rawYear) {
      throw new Error('Не указан год (<YEAR>) для команды link');
    }

    const year = Number(rawYear);
    if (!Number.isInteger(year) || year < 2000 || year > 2999) {
      throw new Error(`Некорректный год: "${rawYear}"`);
    }

    return {
      config: {
        command: 'get-link',
        options: { year },
      },
    };
  }

  const { values, positionals } = parseArgs({
    args: commandArgs,
    allowPositionals: true,
    options: {
      output: { type: 'string', short: 'o' },
      pretty: { type: 'boolean', short: 'p', default: false },
      compact: { type: 'boolean', short: 'c', default: false },
      'transfers-input': { type: 'boolean', short: 'i', default: false },
      'transfers-only': { type: 'boolean', short: 't', default: false },
      'special-only': { type: 'boolean', short: 's', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
  });

  if (values.help) {
    printHelp();
    process.exit(0);
  }

  if (positionals.length > 1) {
    throw new Error(
      `Ожидался максимум один входной файл, получено: ${positionals.join(', ')}`,
    );
  }

  if (values.pretty && values.compact) {
    throw new Error(
      'Флаги --pretty (-p) и --compact (-c) нельзя использовать одновременно',
    );
  }

  if (values['transfers-only'] && values['special-only']) {
    throw new Error(
      'Флаги --transfers-only (-t) и --special-only (-s) нельзя использовать одновременно',
    );
  }

  const format: OutputFormat =
    values.pretty ? 'pretty'
    : values.compact ? 'compact'
    : 'raw';

  const mode: OutputMode =
    values['transfers-only'] ?
      { type: 'transfers-only' }
    : {
        type: 'calendar',
        filter: values['special-only'] ? 'special-only' : 'all',
      };

  return {
    config: {
      command: 'parse',
      options: {
        transfersInput: values['transfers-input'],
        mode,
        format,
      },
    },
    inputFile: positionals[0],
    outputFile: values.output,
  };
}

function printHelp(subcommand?: string): void {
  if (subcommand === 'link' || subcommand === 'l') {
    process.stdout.write(`Usage: ru_calendar_builder.exe link <YEAR>

Arguments:
  <YEAR>  Год для формирования ссылки

Options:
  -h, --help  Print help\n`);
    return;
  }

  process.stdout.write(`Usage: ru_calendar_builder.exe [OPTIONS] [ПУТЬ_К_ФАЙЛУ]
       ru_calendar_builder.exe <COMMAND>

Commands:
  link   Сформировать ссылку на сайт правительства РФ с текстом переносов (<YEAR>) [alias: l]
  parse  Распарсить переносы праздничных дней (режим по умолчанию)
  help   Print this message or the help of the given subcommand(s)

Arguments:
  [ПУТЬ_К_ФАЙЛУ]  Путь к текстовому файлу с переносами (если не указан — читается из stdin)

Options:
  -o, --output <ФАЙЛ>    Сохранить результат в файл (по умолчанию вывод в stdout)
  -p, --pretty           Форматировать вывод JSON (с отступами в 2 пробела)
  -c, --compact          Форматировать вывод JSON один элемент на строку
  -i, --transfers-input  Входные данные — JSON с transfers (вместо текстового формата)
  -t, --transfers-only   Использовать только парсер, вывести переносы
  -s, --special-only     Вывести только особые дни
  -h, --help             Print help\n`);
}
