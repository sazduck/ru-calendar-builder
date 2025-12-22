interface Transfer {
  from: string;
  to: string;
};

type CalendarType = 'working' | 'non_working' | 'shortened';

interface DayOfCalendar {
  date: string;
  type: CalendarType;
  reason?: string;
}

type CalendarObj = Record<
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
    /с[а-я]+\s(\d{1,2})\s([а-я]+)\sна\s[а-я]+\s(\d{1,2})\s([а-я]+)/gm
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
  const holidays = new Set([
    year + '-01-01', year + '-01-02', year + '-01-03', year + '-01-04',
    year + '-01-05', year + '-01-06', year + '-01-07', year + '-01-08',
    year + '-02-23', year + '-03-08', year + '-05-01', year + '-05-09',
    year + '-06-12', year + '-11-04'
  ]);

  const calendar: DayOfCalendar[] = [];

  const startDate = new Date(year + '-01-01');
  const endDate   = new Date(year + '-12-31');

  for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
    const iso = d.toISOString().substring(0, 10); 
    const currentDay: DayOfCalendar = {
      date: iso,
      type: 'working'
    };
    const isHoliday = holidays.has(iso);
    const transferTo = transfers.find(tr => tr.to === iso);
    const transferFrom = transfers.find(tr => tr.from === iso);
    const isWeekend = [6, 0].includes(d.getDay());

    if (isHoliday) {
      currentDay.type = 'non_working';
      currentDay.reason = 'праздник ' + iso;
    } else if (transferTo) {
      currentDay.type = 'non_working';
      currentDay.reason = 'перенос с ' + transferTo.from;
    } else if (transferFrom) {
      currentDay.type = 'working';
      currentDay.reason = 'перенос с ' + transferFrom.to;
    } else if (isWeekend) {
      currentDay.type = 'non_working'
    }

    const nextDay = new Date(d);
    nextDay.setDate(nextDay.getDate() + 1);
    const preholidayOf = [...holidays].find(h => h === nextDay.toISOString().substring(0, 10));
    if (
      currentDay.type === 'working' &&
      preholidayOf
    ) {
      currentDay.type = 'shortened';
      currentDay.reason = 'предпраздничный день перед ' + preholidayOf;
    }
    calendar.push(currentDay);
  }
  return calendar;
}


const transformCalendarToObj = (calendar: DayOfCalendar[])=> {
  return calendar.reduce((acc: CalendarObj, el) => {
    acc[el.date] = {
      type: el.type,
      ...(el.reason ? { reason: el.reason } : {}),
    };
    return acc;
  }, {} as CalendarObj)
}

const str = `Перенести в 2026 году следующие выходные дни:

	с субботы 3 января на пятницу 9 января;

	с воскресенья 4 января на четверг 31 декабря.`;

console.log(JSON.stringify(buildCalendar("2026", parseTransfers(str) || [])));
