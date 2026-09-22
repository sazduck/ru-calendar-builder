import { getCalendarDay } from '@/builder';
import type { Day, Transfer } from '@/types';
import { describe, it, expect } from 'vitest';

describe('getCalendarDay', () => {
  const transfers2024: Transfer[] = [
    { from: '2024-01-06', to: '2024-05-10' },
    { from: '2024-01-07', to: '2024-12-31' },
    { from: '2024-04-27', to: '2024-04-29' },
    { from: '2024-11-02', to: '2024-04-30' },
    { from: '2024-12-28', to: '2024-12-30' },
  ];

  const get2024CalendarDay = (date: string) => getCalendarDay(new Date(date), transfers2024);


  it('возвращает working для обычного буднего', () => {
    const day = get2024CalendarDay('2024-01-09');

    expect(day.type).toBe('working');
    expect(day.date).toBe('2024-01-09');
  });

  it('возвращает non_working для обычной субботы или воскресенья', () => {
    const saturday = get2024CalendarDay('2024-01-13');
    expect(saturday.type).toEqual('non_working');

    const sunday = get2024CalendarDay('2024-01-14');
    expect(sunday.type).toEqual('non_working');
  });

  it('возвращает non_working с holidayName для праздника', () => {
    const day = get2024CalendarDay('2024-01-01')

    expect(day.type).toBe('non_working');
    expect(day.meta?.holidayName).toBe('Новый год');
  });

  it('возвращает non_working с holidayName и с transfedTo для перенсенного выходного праздника', () => {
    const day = get2024CalendarDay('2024-01-07');

    expect(day.type).toBe('non_working');
    expect(day.meta?.holidayName).toBeDefined();;
    expect(day.meta?.transferedTo).toBeDefined();

  });

  it('возвращает non_working для перенсенного выходного не праздника', () => {
    const day = get2024CalendarDay('2024-04-29');

    expect(day.type).toBe('non_working');
    expect(day.meta?.transferedFrom).toBeDefined();
    expect(day.meta?.holidayName).toBeUndefined();
  });

  it('возвращает working с transferedTo для перенесенного с выходного не праздника', () => {
    const day = get2024CalendarDay('2024-04-27');

    expect(day.type).toBe('working');
    expect(day.meta?.transferedTo).toBeDefined();
  });

  it('возвращает shortened для предпраздничного перенесеного дня', () => {
    const day = get2024CalendarDay('2024-11-02');

    expect(day.type).toBe('shortened');
    expect(day.meta?.holidayName).toBeDefined();
  });

  it('возвращает shortened для предпраздничного рабочего дня', () => {
    const day = get2024CalendarDay('2024-02-22');

    expect(day.type).toBe('shortened');
    expect(day.meta?.holidayName).toBeDefined();
  });
});
