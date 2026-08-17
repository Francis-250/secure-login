"use client";

import { useEffect, useRef, useState } from "react";
import { MoreVertical } from "lucide-react";

export type DropdownAction = {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  show?: boolean;
};

export default function ActionDropdown({
  actions,
  label = "Actions",
}: {
  actions: DropdownAction[];
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const visible = actions.filter((a) => a.show !== false);

  useEffect(() => {
    if (!open) return;
    const onDocDown = (e: MouseEvent) => {
      if (
        menuRef.current?.contains(e.target as Node) ||
        buttonRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = () => {
    if (!open) {
      const r = buttonRef.current?.getBoundingClientRect();
      if (r) {
        setPos({ top: r.bottom + 4, left: r.right });
      }
    }
    setOpen((v) => !v);
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-neutral-800 dark:hover:text-slate-50"
      >
        <MoreVertical className="size-4" />
      </button>

      {open && pos && (
        <div
          ref={menuRef}
          role="menu"
          style={{ top: pos.top, left: pos.left }}
          className="fixed z-50 min-w-[180px] -translate-x-full rounded-lg border border-slate-300 bg-white p-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
        >
          {visible.map((action) => (
            <button
              key={action.label}
              type="button"
              role="menuitem"
              disabled={action.disabled}
              onClick={() => {
                setOpen(false);
                action.onClick();
              }}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors disabled:opacity-40 ${
                action.danger
                  ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                  : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-neutral-800"
              }`}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
