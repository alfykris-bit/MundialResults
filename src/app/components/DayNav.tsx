import { useEffect, useRef } from "react";
import { motion } from "motion/react";

interface Props {
  dates: string[];        // sorted unique dates "YYYY-MM-DD"
  selected: string | null;
  onSelect: (date: string | null) => void;
}

function fmt(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00Z");
  const wd = d.toLocaleDateString("es-ES", { weekday: "short" })
               .replace(".", "")
               .toUpperCase();
  const day = d.getDate();
  const mon = d.toLocaleDateString("es-ES", { month: "short" })
               .replace(".", "");
  return { wd, day, mon };
}

function isToday(dateStr: string) {
  const now = new Date();
  const d   = new Date(dateStr + "T12:00:00Z");
  return (
    d.getUTCFullYear() === now.getUTCFullYear() &&
    d.getUTCMonth()    === now.getUTCMonth() &&
    d.getUTCDate()     === now.getUTCDate()
  );
}

export function DayNav({ dates, selected, onSelect }: Props) {
  const scrollRef  = useRef<HTMLDivElement>(null);
  const activeRef  = useRef<HTMLButtonElement>(null);

  // Auto-scroll active pill into view on mount / change
  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      activeRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [selected]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      style={{
        borderBottom: "1px solid #e6e6e6",
        backgroundColor: "#ffffff",
      }}
    >
      <div
        ref={scrollRef}
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "10px 16px",
          display: "flex",
          gap: 6,
          overflowX: "auto",
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch" as any,
          alignItems: "center",
        }}
      >
        {/* "Todos" pill */}
        <button
          onClick={() => onSelect(null)}
          style={{
            flexShrink: 0,
            padding: "6px 14px",
            borderRadius: 50,
            border: "1px solid #e6e6e6",
            backgroundColor: selected === null ? "#000000" : "#f7f7f5",
            color: selected === null ? "#ffffff" : "#595959",
            fontSize: 12,
            fontWeight: selected === null ? 600 : 400,
            fontFamily: "Inter, sans-serif",
            cursor: "pointer",
            whiteSpace: "nowrap",
            transition: "background-color 0.15s, color 0.15s",
          }}
        >
          Todos
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 20, backgroundColor: "#e6e6e6", flexShrink: 0 }} />

        {/* Date pills */}
        {dates.map((date) => {
          const { wd, day, mon } = fmt(date);
          const active  = selected === date;
          const today   = isToday(date);

          return (
            <button
              key={date}
              ref={active ? activeRef : undefined}
              onClick={() => onSelect(active ? null : date)}
              style={{
                flexShrink: 0,
                padding: "5px 12px",
                borderRadius: 50,
                border: today && !active
                  ? "1.5px solid #000000"
                  : "1px solid #e6e6e6",
                backgroundColor: active ? "#000000" : today ? "#f7f7f5" : "#f7f7f5",
                color: active ? "#ffffff" : "#3d3d3d",
                fontSize: 12,
                fontWeight: active ? 600 : today ? 600 : 400,
                fontFamily: "Inter, sans-serif",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "background-color 0.15s, color 0.15s",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                letterSpacing: "0.4px",
                color: active ? "rgba(255,255,255,0.6)" : "#767676",
                textTransform: "uppercase",
              }}>
                {wd}
              </span>
              <span style={{ fontWeight: active ? 700 : today ? 700 : 500 }}>
                {day}
              </span>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                color: active ? "rgba(255,255,255,0.7)" : "#767676",
                textTransform: "lowercase",
              }}>
                {mon}
              </span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
