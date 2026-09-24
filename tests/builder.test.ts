import { describe, it, expect, assert } from 'vitest';
import calendarExpected2024 from './fixtures/buildCalendar.expected.json';
import { buildCalendar, getCalendarDay } from '@lib/builder';
import type { DayOffTransfer } from '@lib/types';

const transfers2024: DayOffTransfer[] = [
  { from: '2024-01-06', to: '2024-05-10' },
  { from: '2024-01-07', to: '2024-12-31' },
  { from: '2024-04-27', to: '2024-04-29' },
  { from: '2024-11-02', to: '2024-04-30' },
  { from: '2024-12-28', to: '2024-12-30' },
];

describe('getCalendarDay', () => {
  const get2024CalendarDay = (date: string) =>
    getCalendarDay(new Date(date), transfers2024);

  it('возвращает working для обычного буднего', () => {
    const day = get2024CalendarDay('2024-01-09');

    expect(day.type).toBe('working');
    expect(day.date).toBe('2024-01-09');
  });

  it('возвращает dayOff для обычной субботы или воскресенья', () => {
    const saturday = get2024CalendarDay('2024-01-13');
    expect(saturday.type).toBe('dayOff');

    const sunday = get2024CalendarDay('2024-01-14');
    expect(sunday.type).toBe('dayOff');
  });

  it('возвращает dayOff с holidayName для праздника', () => {
    const day = get2024CalendarDay('2024-01-01');

    expect(day.type).toBe('dayOff');
    if (day.type !== 'dayOff') {
      return
    }
    expect(day.meta?.holidayName).toBe('Новый год');
  });

  it('возвращает dayOff с holidayName и с transferredTo для перенсенного праздника', () => {
    const day = get2024CalendarDay('2024-01-07');

    expect(day.type).toBe('dayOff');
    assert(day.meta, 'метаданные не опеределны');
    if (!('transferredTo' in day.meta)) {
      expect.fail('day.meta does not contain transferredFrom');
    }
    expect(day.meta.transferredTo).toBeDefined();
    expect(day.meta.holidayName).toBe('Рождество Христово');
  });

  it('возвращает dayOff для перенесенного выходного не праздника', () => {
    const day = get2024CalendarDay('2024-04-29');

    expect(day.type).toBe('dayOff');
    assert(day.meta, 'метаданные не опеределны');
    if (!('transferredFrom' in day.meta)) {
      expect.fail('day.meta does not contain transferredFrom');
    }
    expect(day.meta.transferredFrom).toBe('2024-04-27');
    expect(day.meta.holidayName).toBeUndefined();
  });

  it('возвращает working с transferedTo для перенесенного с выходного не праздника', () => {
    const day = get2024CalendarDay('2024-04-27');

    expect(day.type).toBe('working');
    assert(day.meta, 'метаданные не опеределны');
    expect(day.meta).toBeDefined();
    if (!('transferredTo' in day.meta)) {
      expect.fail('day.meta does not contain transferredFrom');
    }
    expect(day.meta.transferredTo).toBe('2024-04-29');
  });

  it('возвращает shortened с transferedTo для перенесенного предпраздничного дня', () => {
    const day = get2024CalendarDay('2024-11-02');

    expect(day.type).toBe('shortened');
    assert(day.meta, 'метаданные не опеределны');
    if (!('transferredTo' in day.meta)) {
      expect.fail('day.meta does not contain transferredFrom');
    }
    expect(day.meta.transferredTo).toBe('2024-04-30');
    expect(day.meta.holidayName).toBe('День труда');
  });

  it('возвращает shortened для предпраздничного рабочего дня', () => {
    const day = get2024CalendarDay('2024-02-22');

    expect(day.type).toBe('shortened');
    expect(day.meta?.holidayName).toBe('День защитника отечества');
  });
});

describe('buildCalendar', () => {
  it('возвращает корректные данные', () => {
    expect(buildCalendar(2024, transfers2024)).toEqual(calendarExpected2024);
  });
});
