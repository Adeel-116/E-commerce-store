'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function toISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildMonthGrid(viewDate: Date): Date[] {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const gridStart = new Date(year, month, 1 - firstDay.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
}

export default function DateRangeCalendar({
  from,
  to,
  onSelectDay,
}: {
  from: string;
  to: string;
  onSelectDay: (iso: string) => void;
}) {
  const [viewDate, setViewDate] = useState(() => (to ? new Date(to) : from ? new Date(from) : new Date()));

  const today = toISO(new Date());
  const days = buildMonthGrid(viewDate);
  const monthLabel = viewDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  return (
    <div className="range-cal">
      <div className="range-cal-header">
        <button
          type="button"
          className="range-cal-nav"
          onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
        >
          <ChevronLeft size={14} />
        </button>
        <span>{monthLabel}</span>
        <button
          type="button"
          className="range-cal-nav"
          onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
        >
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="range-cal-weekdays">
        {WEEKDAYS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>

      <div className="range-cal-grid">
        {days.map((d) => {
          const iso = toISO(d);
          const inMonth = d.getMonth() === viewDate.getMonth();
          const isFuture = iso > today;
          const isStart = !!from && iso === from;
          const isEnd = !!to && iso === to;
          const inRange = !!from && !!to && iso > from && iso < to;
          const cls = [
            'range-cal-day',
            !inMonth && 'range-cal-day-muted',
            isFuture && 'range-cal-day-disabled',
            (isStart || isEnd) && 'range-cal-day-selected',
            inRange && 'range-cal-day-in-range',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <button
              type="button"
              key={iso}
              className={cls}
              disabled={isFuture}
              onClick={() => onSelectDay(iso)}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
