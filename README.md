# ru-calendar-builder

A zero-dependency TypeScript library and CLI tool for parsing Russian government holiday transfer decrees and generating production calendars for any year.

Powered by the native [`Temporal`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal) API.

## Features

- **Text Parser (`parseTransfers`)**: Extracts year and day-off transfer rules (e.g., _"с субботы 4 января на пятницу 2 мая"_) from official decree texts using `Result<T, E>` error handling.
- **Calendar Generator (`buildCalendar`)**: Builds a full-year array of days with exact day types (`working`, `dayOff`, `shortened`) and reasons (`holiday`, `weekend`, `preholiday`, `transfer`).
- **CLI Included**: Use directly from the command line with `stdin`/`stdout` piping, file I/O, JSON formatting (`pretty`, `compact`, `raw`), and government decree URL generation.
- **Zero Runtime Dependencies**: Lightweight ESM package built on standard `Temporal` and Node.js built-ins.

## Environment Requirements

This library relies on the standard global **`Temporal`** API:

- **Node.js**: `>= 24.0.0` (or older versions with `--harmony-temporal` / polyfill)
- **Deno / Bun**: Supported natively in modern versions
- **Browsers**: Supported in Chrome, Edge, and Firefox (for Safari or older environments, load [`temporal-polyfill`](https://www.npmjs.com/package/temporal-polyfill) before importing)

## Installation

```bash
# From GitHub
pnpm add github:sazduck/ru-calendar-builder

# Or via npm (once published)
npm install ru-calendar-builder
```

## Library Usage

```ts
import { parseTransfers, buildCalendar } from 'ru-calendar-builder';

const decreeText = `
  О переносе выходных дней в 2026 году:
  перенести следующие выходные дни:
  с субботы 3 января на пятницу 9 января;
  с воскресенья 4 января на четверг 31 декабря.
`;

// 1. Parse transfer rules from text
const parsed = parseTransfers(decreeText);

if (!parsed.ok) {
  console.error('Parse error:', parsed.error);
  process.exit(1);
}

// 2. Build the full calendar for the parsed year
const calendar = buildCalendar(parsed.value.year, parsed.value.transfers);

console.log(calendar.slice(0, 5));
/*
[
  { date: '2026-01-01', type: 'dayOff', reason: { type: 'holiday', holidayName: 'Новогодние каникулы' } },
  ...
  { date: '2026-01-09', type: 'dayOff', reason: { type: 'transfer', dir: 'from', src: '2026-01-03' } }
]
*/
```

### API Reference

#### `parseTransfers(str: string): Result<YearTransfers, string>`

Parses a Russian decree text containing a 4-digit year and transfer phrases matching `с <weekday> <day> <month> ... на <weekday> <day> <month>`.

- **Returns**: `{ ok: true, value: { year: number, transfers: DayOffTransfer[] } }` or `{ ok: false, error: string }`.

#### `buildCalendar(year: number, transfers: DayOffTransfer[]): Day[]`

Generates an array of `Day` objects for every day of the specified `year`, accounting for:

- Fixed Russian public holidays (`HOLIDAYS`)
- Standard weekends (Saturday & Sunday)
- Pre-holiday shortened workdays (`shortened`)
- Applied `transfers` (accurately resolving both the source day and destination day types, including shortened pre-holiday transfers)

### Exported Types

- `DayType`: `'working' | 'dayOff' | 'shortened'`
- `CalendarStatus`: `HolidayReason | PreholidayReason | WeekendReason | TransferReason`
- `Day`, `Result`, `HolidayReason`, `PreholidayReason`, `WeekendReason`, `TransferReason`

---

## CLI Usage

Run via `npx` / `pnpm dlx` or install globally:

```bash
ru-calendar-builder [OPTIONS] [FILE_PATH]
ru-calendar-builder <COMMAND>
```

### Commands

| Command             | Alias       | Description                                                         |
| :------------------ | :---------- | :------------------------------------------------------------------ |
| `parse [FILE_PATH]` | _(default)_ | Parse transfer text (from file or `stdin`) and output calendar JSON |
| `link <YEAR>`       | `l`         | Generate a search/decree URL on `government.ru` for `<YEAR>`        |
| `help`              |             | Print help message                                                  |

### Options

| Flag                    | Description                                                         |
| :---------------------- | :------------------------------------------------------------------ |
| `-o, --output <FILE>`   | Write output to `<FILE>` instead of `stdout`                        |
| `-p, --pretty`          | Format JSON output with 2-space indentation                         |
| `-c, --compact`         | Format JSON output as one item per line (NDJSON-style)              |
| `-i, --transfers-input` | Treat input as pre-parsed transfers JSON instead of raw decree text |
| `-t, --transfers-only`  | Output only parsed transfers without building the full calendar     |
| `-s, --special-only`    | Output only non-standard days (exclude regular `working` days)      |
| `-h, --help`            | Print help                                                          |

### CLI Examples

```bash
# Parse from a text file with pretty JSON output
ru-calendar-builder -p transfers-2026.txt -o calendar-2026.json

# Pipe text via stdin and output only special days (holidays, weekends, shortened, transfers)
cat decree.txt | ru-calendar-builder --special-only --compact

# Extract only transfers JSON, then build calendar in a second step
ru-calendar-builder -t decree.txt | ru-calendar-builder -i -p

# Get government.ru decree link for 2026
ru-calendar-builder link 2026
```

## License

MIT
