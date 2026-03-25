'use client';

import React from 'react';
import { DayPicker } from 'react-day-picker';
import { format, parseISO, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

/**
 * Premium Obsidian Appointment Calendar
 * Highlights days where the patient has booked consultations.
 */
export default function PatientCalendar({ appointments = [] }) {
  const [month, setMonth] = React.useState(new Date());

  // Derive booked dates (strictly confirmed only)
  const bookedDates = appointments
    .filter(appt => appt.status === 'confirmed')
    .map(appt => parseISO(appt.date));

  // Custom modifiers for react-day-picker
  const modifiers = {
    booked: bookedDates,
  };

  const modifiersStyles = {
    booked: {
      color: '#38bdf8', // sky-400
      fontWeight: 'bold',
      textDecoration: 'underline',
      textDecorationColor: 'rgba(56, 189, 248, 0.4)',
      textUnderlineOffset: '4px'
    }
  };

  return (
    <div className="neon-glass-card group obsidian-card" style={{ 
      padding: '24px', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '24px', 
      border: '1px solid rgba(255, 255, 255, 0.2)',
      height: '100%',
      minHeight: '440px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '36px', 
            height: '36px', 
            borderRadius: '10px', 
            background: 'rgba(56, 189, 248, 0.12)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <CalendarIcon size={16} className="text-sky-400" />
          </div>
          <span style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>Health Calendar</span>
        </div>
        <div style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.2)' }}>
          Tracking
        </div>
      </div>

      <div className="w-full h-full flex flex-col justify-start">
        <DayPicker
          mode="single"
          month={month}
          onMonthChange={setMonth}
          modifiers={modifiers}
          modifiersClassNames={{
            booked: 'rdp-day_booked'
          }}
          classNames={{
            months: 'w-full flex-1 flex flex-col',
            month: 'w-full flex-1 flex flex-col',
            caption: 'flex justify-start items-center gap-4 mb-4 mt-2',
            caption_label: 'text-xl font-black text-white uppercase tracking-[0.25em] ml-1',
            nav: 'flex items-center gap-2 ml-auto',
            nav_button: 'h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl border border-white/10 hover:bg-white/5',
            table: 'w-full flex-1 flex flex-col grow gap-4',
            weekdays: 'grid grid-cols-7 w-full gap-2 mb-2',
            weekday: 'text-white/30 rounded-md font-black text-xs uppercase tracking-tighter text-center h-8 flex items-center justify-center',
            week: 'grid grid-cols-7 w-full gap-2',
            cell: 'relative p-0 text-center text-sm focus-within:relative focus-within:z-20 w-full hover:bg-white/5 rounded-2xl transition-all duration-200',
            day: 'h-14 w-full p-0 font-bold aria-selected:opacity-100 text-white/50 flex items-center justify-center cursor-pointer text-xl',
            day_today: 'bg-white/5 text-white font-black rounded-2xl outline outline-2 outline-white/20 scale-105 shadow-xl',
            day_outside: 'text-white/5 opacity-50',
            day_disabled: 'text-muted-foreground opacity-50',
            day_hidden: 'invisible',
          }}
          components={{
            CaptionLabel: (props) => {
              const displayDate = props.displayMonth || month;
              try {
                return (
                  <span className="text-2xl font-black text-white uppercase tracking-[0.3em] inline-block mb-10 mt-2 px-1">
                    {format(displayDate, 'MMMM yyyy')}
                  </span>
                );
              } catch (e) {
                return null;
              }
            },
            Nav: ({ displayMonth, onPreviousClick, onNextClick, ...props }) => (
              <div className="flex items-center gap-4 ml-auto pr-2 mb-10 mt-2">
                <button onClick={() => setMonth(new Date(month.setMonth(month.getMonth() - 1)))} 
                  className="group h-12 w-12 bg-white/5 opacity-60 hover:opacity-100 transition-all flex items-center justify-center rounded-2xl active:scale-90">
                  <ChevronLeft size={28} style={{ stroke: '#38bdf8', strokeWidth: '3px' }} className="group-hover:scale-110 transition-transform" />
                </button>
                <button onClick={() => setMonth(new Date(month.setMonth(month.getMonth() + 1)))}
                  className="group h-12 w-12 bg-transparent opacity-60 hover:opacity-100 transition-all flex items-center justify-center rounded-2xl hover:bg-white/5 active:scale-90">
                  <ChevronRight size={28} style={{ stroke: '#38bdf8', strokeWidth: '3px' }} className="group-hover:scale-110 transition-transform" />
                </button>
              </div>
            ),
          }}
        />
      </div>

      <div style={{ 
        marginTop: 'auto',
        padding: '12px', 
        borderRadius: '12px', 
        background: 'rgba(56, 189, 248, 0.05)', 
        border: '1px solid rgba(56, 189, 248, 0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 10px rgba(56, 189, 248, 0.5)' }} />
        <span style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.5)' }}>
          {bookedDates.length} Appointment{bookedDates.length !== 1 ? 's' : ''} Scheduled
        </span>
      </div>

      <style jsx global>{`
        .rdp-day_booked {
          position: relative;
          color: #000 !important;
          background: #fff !important;
          border-radius: 50% !important;
          font-weight: 900;
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
          transform: scale(0.9);
        }
        .rdp-day_booked:hover {
          background: rgba(255, 255, 255, 0.9) !important;
          transform: scale(1);
        }
      `}</style>
    </div>
  );
}
