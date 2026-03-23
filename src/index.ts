import fs from 'node:fs/promises';

interface Transfer {
  from: string;
  to: string;
}
type CalendarType = 'working' | 'non_working' | 'shortened';

interface Day {
  date: string;
  type: CalendarType;
  reason?: string;
}

type DayObj = Record<
  string,
  {
    type: CalendarType;
    reason?: string;
  }
>;

const parseTransfers = (str: string) => {
  const year = str.match(/\d{4}/);
  const months: Record<string, string> = {
    января: '01',
    февраля: '02',
    марта: '03',
    апреля: '04',
    мая: '05',
    июня: '06',
    июля: '07',
    августа: '08',
    сентября: '09',
    октября: '10',
    ноября: '11',
    декабря: '12',
  };

  const matches = str.matchAll(
    /с[а-я]+\s(\d{1,2})\s([а-я]+)\sна\s[а-я]+\s(\d{1,2})\s([а-я]+)/gm,
  );

  const res: Transfer[] = [];
  for (let m of matches) {
    if (!m[1] || !m[2] || !m[3] || !m[4]) {
      console.error(new Error('ошибка парсинга'));
      return null;
    }
    res.push({
      from: year + '-' + months[m[2]] + '-' + m[1].padStart(2, '0'),
      to: year + '-' + months[m[4]] + '-' + m[3].padStart(2, '0'),
    });
  }
  return res;
};

const buildCalendar = (year: string, transfers: Transfer[]) => {
  const holidays = {
    [year + '-01-01']: 'Новый год',
    [year + '-01-02']: 'Новогодние каникулы',
    [year + '-01-03']: 'Новогодние каникулы',
    [year + '-01-04']: 'Новогодние каникулы',
    [year + '-01-05']: 'Новогодние каникулы',
    [year + '-01-06']: 'Новогодние каникулы',
    [year + '-01-07']: 'Рождество Христово',
    [year + '-01-08']: 'Новогодние каникулы',
    [year + '-02-23']: 'День защитника отечества',
    [year + '-03-08']: 'Международный женский день',
    [year + '-05-01']: 'День труда',
    [year + '-05-09']: 'День победы',
    [year + '-06-12']: 'День России',
    [year + '-11-04']: 'День народного единства',
  };

  const calendar: Day[] = [];

  const startDate = new Date(year + '-01-01');
  const endDate = new Date(year + '-12-31');

  for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
    const isoDate = d.toISOString().substring(0, 10);
    const currentDay: Day = {
      date: isoDate,
      type: 'working',
    };
    const isHoliday = isoDate in holidays;
    const transferTo = transfers.find((tr) => tr.to === isoDate);
    const transferFrom = transfers.find((tr) => tr.from === isoDate);
    const isWeekend = [6, 0].includes(d.getDay());

    if (isHoliday) {
      currentDay.type = 'non_working';
      currentDay.reason = holidays[isoDate]!;
    } else if (transferTo) {
      currentDay.type = 'non_working';
      currentDay.reason = transferTo.from;
    } else if (transferFrom) {
      currentDay.type = 'working';
      currentDay.reason = transferFrom.to;
    } else if (isWeekend) {
      currentDay.type = 'non_working';
    }

    const nextDay = new Date(d);
    nextDay.setDate(nextDay.getDate() + 1);
    const preholidayOf = Object.keys(holidays).find(
      (h) => h === nextDay.toISOString().substring(0, 10),
    );
    if (currentDay.type === 'working' && preholidayOf) {
      currentDay.type = 'shortened';
      currentDay.reason = holidays[preholidayOf]!;
    }
    calendar.push(currentDay);
  }
  return calendar;
};

const transformCalendarToObj = (calendar: Day[]) => {
  return calendar.reduce((acc: DayObj, el) => {
    acc[el.date] = {
      type: el.type,
      ...(el.reason ? { reason: el.reason } : {}),
    };
    return acc;
  }, {} as DayObj);
};

if (import.meta.main) {
  const str = `Перенести в 2026 году следующие выходные дни:

	с субботы 3 января на пятницу 9 января;

	с воскресенья 4 января на четверг 31 декабря.`;

  const calendar = buildCalendar('2026', parseTransfers(str) || []);
  const calendarObj = transformCalendarToObj(calendar);

  const outPath = 'dist/';
  try {
    await fs.mkdir(outPath);
    console.log(`создан каталог ${outPath}`);
  } catch (err) {
    if (!(err instanceof Error && 'code' in err && err.code === 'EEXIST')) {
      throw err;
    }
  }
  const jsonFileName = outPath + 'out.json';
  await fs.writeFile(jsonFileName, JSON.stringify(calendar), {
    encoding: 'utf-8',
    flag: 'w+',
  });
  await fs.writeFile('outObj.json', JSON.stringify(calendarObj), {
    encoding: 'utf-8',
    flag: 'w+',
  });
}
