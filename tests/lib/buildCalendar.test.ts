import { buildCalendar, type DayOffTransfer } from "@/index";
import calendarExpected2024 from '../fixtures/buildCalendar.expected.json';
import { describe, expect, it } from "vitest";

const transfers2024: DayOffTransfer[] = [
  { from: '2024-01-06', to: '2024-05-10' }, // праздник             -> будний
  { from: '2024-01-07', to: '2024-12-31' }, // праздник + выходной  -> будний
  { from: '2024-04-27', to: '2024-04-29' }, // выходной             -> будний
  { from: '2024-11-02', to: '2024-04-30' }, // выходной             -> предпаздник
  { from: '2024-12-28', to: '2024-12-30' }, // выходной             -> будний
];

describe('buildCalendar', () => {
  it('возвращает корректные данные', () => {
    const calendar = buildCalendar(2024, transfers2024);
    expect(calendar).toEqual(calendarExpected2024);
  });
});
