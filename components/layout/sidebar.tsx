// components/layout/Sidebar.tsx
"use client";

import React from "react";

const NAVIGATION_ITEMS = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="size-[18px] fill-current overflow-visible"
        viewBox="0 0 512 512"
        aria-hidden="true"
      >
        <path d="M426 495.983H86c-25.364 0-46-20.635-46-46v-242.02c0-8.836 7.163-16 16-16s16 7.164 16 16v242.02c0 7.72 6.28 14 14 14h340c7.72 0 14-6.28 14-14v-242.02c0-8.836 7.163-16 16-16s16 7.164 16 16v242.02c0 25.364-20.635 46-46 46" />
        <path d="M496 263.958a15.95 15.95 0 0 1-11.313-4.687L285.698 60.284c-16.375-16.376-43.02-16.376-59.396 0L27.314 259.272c-6.248 6.249-16.379 6.249-22.627 0-6.249-6.248-6.249-16.379 0-22.627L203.675 37.656c28.852-28.852 75.799-28.852 104.65 0l198.988 198.988c6.249 6.249 6.249 16.379 0 22.627A15.94 15.94 0 0 1 496 263.958M320 495.983H192c-8.837 0-16-7.164-16-16v-142c0-27.57 22.43-50 50-50h60c27.57 0 50 22.43 50 50v142c0 8.836-7.163 16-16 16m-112-32h96v-126c0-9.925-8.075-18-18-18h-60c-9.925 0-18 8.075-18 18z" />
      </svg>
    ),
  },
  {
    id: "profile",
    label: "Profile",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="size-[18px] fill-current overflow-visible"
        viewBox="0 0 512 512"
        aria-hidden="true"
      >
        <path d="M253.414 103.434c48.556 0 87.919 40.52 87.919 90.505s-39.363 90.505-87.919 90.505-87.919-40.521-87.919-90.505 39.363-90.505 87.919-90.505m0 36.202c-28.324 0-51.717 24.081-51.717 54.303s23.393 54.303 51.717 54.303 51.717-24.081 51.717-54.303-23.393-54.303-51.717-54.303" />
        <path d="M253.414 0c139.957 0 253.414 113.457 253.414 253.414 0 94.285-51.491 176.544-127.886 220.19-35.728 20.575-77.036 32.582-121.104 33.199l-4.423.025C113.457 506.828 0 393.371 0 253.414S113.457 0 253.414 0m-23.676 346.505c-46.331 0-87.479 29.378-102.607 73.008l-2.339 7.571c35.919 27.232 80.165 42.893 126.504 43.522l5.709-.009c38.24-.62 74.079-11.122 105.072-29.064l19.977-13.243-2.237-6.866c-14.371-44.046-55.062-74.052-101.239-74.901zm23.676-310.303c-119.963 0-217.212 97.249-217.212 217.212 0 57.493 22.337 109.77 58.807 148.624 21.668-55.072 74.965-91.735 134.73-91.735h46.831c59.905 0 113.311 36.835 134.885 92.121 36.686-38.892 59.172-91.325 59.172-149.01-.001-119.963-97.25-217.212-217.213-217.212" />
      </svg>
    ),
  },
  {
    id: "settings",
    label: "Settings",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="size-[18px] fill-current overflow-visible"
        viewBox="0 0 32 32"
        aria-hidden="true"
      >
        <g data-name="Layer 2">
          <path d="M24.915 3.663a3.15 3.15 0 0 0-2.688-1.554H9.774a3.15 3.15 0 0 0-2.688 1.554L.859 14.446a3.15 3.15 0 0 0 0 3.15l6.227 10.742a3.15 3.15 0 0 0 2.688 1.554h12.453a3.15 3.15 0 0 0 2.688-1.554l6.226-10.784a3.15 3.15 0 0 0 0-3.15zm4.41 12.841-6.227 10.784a1.05 1.05 0 0 1-.871.504H9.774a1.05 1.05 0 0 1-.872-.504L2.676 16.504a1.05 1.05 0 0 1 0-1.05L8.902 4.713a1.05 1.05 0 0 1 .872-.504h12.453a1.05 1.05 0 0 1 .871.504l6.227 10.783a1.05 1.05 0 0 1 0 1.008" />
          <path d="M16 9.7a6.3 6.3 0 1 0 6.3 6.3A6.3 6.3 0 0 0 16 9.7m0 10.5a4.2 4.2 0 1 1 4.2-4.2 4.2 4.2 0 0 1-4.2 4.2" />
        </g>
      </svg>
    ),
  },
];

interface SidebarProps {
  isOpen: boolean;
}

export default function Sidebar({ isOpen }: SidebarProps) {
  return (
    <aside
      id="sidebar"
      className={`${
        isOpen ? "w-[264px] min-w-[264px]" : "w-[68px] min-w-[68px]"
      } overflow-hidden transition-all duration-300 ease-in-out`}
      aria-label="Sidebar navigation"
    >
      <div
        className={`fixed top-0 left-0 h-full flex flex-col overflow-auto py-6 px-4 bg-white dark:bg-neutral-900 border-r border-slate-300 dark:border-neutral-700 transition-all duration-300 ease-in-out ${
          isOpen ? "w-[264px]" : "w-[68px] px-2"
        }`}
      >
        <div className={`mb-6 ${!isOpen && "flex justify-center"}`}>
          <a
            href="#"
            className="min-h-9 inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          >
            <span className="sr-only">SECURE LOGIN</span>
            {isOpen ? (
              <img
                src="https://readymadeui.com/readymadeui.svg"
                alt="logo"
                className="w-36 block dark:invert dark:brightness-100"
              />
            ) : (
              <div className="w-9 h-9 bg-blue-600 rounded-md flex items-center justify-center text-white font-bold text-sm">
                SL
              </div>
            )}
          </a>
        </div>

        <nav className="flex-1" aria-label="Primary sidebar navigation">
          <ul className="space-y-2 text-sm text-slate-800 dark:text-slate-400 font-medium">
            {NAVIGATION_ITEMS.map((item) => (
              <li key={item.id}>
                <a
                  href="#"
                  className={`flex items-center gap-2.5 hover:text-slate-900 hover:bg-slate-100 rounded-md px-3 py-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:text-slate-50 dark:hover:bg-neutral-800 ${
                    !isOpen && "justify-center px-2"
                  }`}
                  title={!isOpen ? item.label : undefined}
                >
                  {item.icon}
                  {isOpen && <span>{item.label}</span>}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <a
          href="#"
          className={`flex flex-wrap items-center gap-4 rounded-md mt-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            !isOpen && "justify-center"
          }`}
        >
          <img
            src="https://readymadeui.com/team-2.webp"
            className="w-10 h-10 rounded-md border border-slate-300 dark:border-neutral-700"
            alt="User avatar"
          />
          {isOpen && (
            <div>
              <p className="text-sm text-slate-800 dark:text-slate-400 font-medium">
                John Doe
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Active free account
              </p>
            </div>
          )}
        </a>
      </div>
    </aside>
  );
}
