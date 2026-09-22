import { buildCalendar } from "./builder";
import { parseTransfers } from "./parser";


async function main() {

  const str = `
    Перенести в 2024 году следующие выходные дни:

    с субботы 6 января на пятницу 10 мая;

    с воскресенья 7 января на вторник 31 декабря;

    с субботы 27 апреля на понедельник 29 апреля;

    с субботы 2 ноября на вторник 30 апреля;

    с субботы 28 декабря на понедельник 30 декабря.

`;

  const transfers = parseTransfers(str);
  if (!transfers.ok) {
    throw transfers.error;
  }
  console.log(transfers);
  const calendar = buildCalendar('2024', transfers.value);
  console.log(JSON.stringify(calendar));
}

if (import.meta.main) {
  main();
}
