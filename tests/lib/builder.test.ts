import { describe, it, expect, assert } from 'vitest';
import calendarExpected2024 from '../fixtures/buildCalendar.expected.json';
import { buildCalendar, getCalendarDay } from '@lib/builder';
import type { DayOffTransfer } from '@lib/types';

const transfers2024: DayOffTransfer[] = [
  { from: '2024-01-06', to: '2024-05-10' }, // праздник             -> будний
  { from: '2024-01-07', to: '2024-12-31' }, // праздник + выходной  -> будний
  { from: '2024-04-27', to: '2024-04-29' }, // выходной             -> будний
  { from: '2024-11-02', to: '2024-04-30' }, // выходной             -> предпаздник
  { from: '2024-12-28', to: '2024-12-30' }, // выходной             -> будний
];

describe('getCalendarDay', () => {
  const get2024CalendarDay = (date: string) =>
    getCalendarDay(new Date(date), transfers2024);

  it('возвращает working', () => {
    const day = get2024CalendarDay('2024-01-09');

    expect(day.type).toBe('working');
    expect(day.date).toBe('2024-01-09');
  });

  it('возвращает dayOff для сб и вс', () => {
    const saturday = get2024CalendarDay('2024-01-13');
    expect(saturday.type).toBe('dayOff');
    assert(saturday.reason)
    expect(saturday.reason.type).toBe('weekend')

    const sunday = get2024CalendarDay('2024-01-14');
    expect(sunday.type).toBe('dayOff');
    assert(sunday.reason)
    expect(sunday.reason.type).toBe('weekend')
  });

  it('возвращает dayOff для праздника', () => {
    const day = get2024CalendarDay('2024-01-01');

    expect(day.type).toBe('dayOff');
    assert(day.reason)
    expect(day.reason.type).toBe('holiday')
  });

  it('возвращает dayOff для перенсенного праздника', () => {
    const day = get2024CalendarDay('2024-01-07');

    expect(day.type).toBe('dayOff');
    assert(day.reason)
    expect(day.reason.type).toBe('holiday');
  });

  it('возвращает dayOff для перенесенного выходного (стал выходным)', () => {
    const day = get2024CalendarDay('2024-04-29');

    expect(day.type).toBe('dayOff');
    assert(day.reason)
    expect(day.reason.type).toBe('transfer');
  });

  it('возвращает dayOff для перенесенного с предпраздника', () => {
    const day = get2024CalendarDay('2024-04-30');

    expect(day.type).toBe('dayOff');
    assert(day.reason)
    expect(day.reason.type).toBe('transfer');
  });

  it('возвращает dayOff для предпраздника выпавшего на выходной', () => {
    const day = get2024CalendarDay('2024-11-03');

    expect(day.type).toBe('dayOff');
    assert(day.reason)
    expect(day.reason.type).toBe('weekend');
  });

  it('возвращает working для перенесенного выходного (был выходным)', () => {
    const day = get2024CalendarDay('2024-04-27');

    expect(day.type).toBe('working');
    assert(day.reason)
    expect(day.reason.type).toBe('transfer');
  });

  it('возвращает shortened для предпраздничного дня', () => {
    const day = get2024CalendarDay('2024-02-22');

    expect(day.type).toBe('shortened');
    assert(day.reason)
    expect(day.reason.type).toBe('preholiday');
  });

  it('возвращает shortened для перенесенного предпраздничного дня', () => {
    const day = get2024CalendarDay('2024-11-02');

    expect(day.type).toBe('shortened');
    assert(day.reason)
    expect(day.reason.type).toBe('transfer');
  });

});

describe('buildCalendar', () => {
  it('возвращает корректные данные', () => {
    const calendar = buildCalendar(2024, transfers2024)
    expect(calendar).toEqual(calendarExpected2024);
  });
});
