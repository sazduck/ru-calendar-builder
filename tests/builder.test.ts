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

  it('возвращает working для обычного будня', () => {
    const date = new Date('2024-01-09'); // Понедельник
    const day = getCalendarDay(date, transfers2024);

    expect(day.type).toBe('working');
    expect(day.date).toBe('2024-01-09');
  });

  it('возвращает non_working для выходного', () => {
    const date = new Date('2024-01-13'); // Суббота
    const day = getCalendarDay(date, transfers2024);

    expect(day.type).toEqual('non_working');
    expect(day.date).toBe('2024-01-13');
  });

  it('возвращает non_working с holidayName для праздника', () => {
    const date = new Date('2024-01-01');
    const day = getCalendarDay(date, transfers2024);

    expect(day.type).toBe('non_working');
    expect(day.meta?.holidayName).toBe('Новый год');
  });

  it('возвращает non_working для перенсенного выходного', () => {
    const date = new Date('2024-04-29');
    const day = getCalendarDay(date, transfers2024);

    expect(day.type).toBe('non_working');
  });

  it('возвращает working с transferedFrom для перносимого', () => {
    const date = new Date('2024-04-27');
    const day = getCalendarDay(date, transfers2024);

    expect(day.type).toBe('working');
    expect(day.meta?.transferedTo?.date).toBe('2024-04-29');
  });

  it('возвращает shortened для предпраздничного дня', () => {
    const date = new Date('2024-02-22');
    const day = getCalendarDay(date, []);

    expect(day.type).toBe('shortened');
    expect(day.meta?.holidayName).toBe('День защитника отечества');
  });

  it('возвращает shortened для предпраздничного дня', () => {
    const date = new Date('2024-02-22');
    const day = getCalendarDay(date, []);

    expect(day.type).toBe('shortened');
    expect(day.meta?.holidayName).toBe('День защитника отечества');
  });
});
