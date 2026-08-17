"use client";

import Image from "next/image";
import React, { useState, useRef, useEffect } from "react";

const PROFILE_MENU = [
  {
    label: "My Profile",
    icon: (
      <svg
        className="size-4.5 fill-current"
        aria-hidden="true"
        viewBox="0 0 512 512"
      >
        <path d="M253.414 103.434c48.556 0 87.919 40.52 87.919 90.505s-39.363 90.505-87.919 90.505-87.919-40.521-87.919-90.505 39.363-90.505 87.919-90.505m0 36.202c-28.324 0-51.717 24.081-51.717 54.303s23.393 54.303 51.717 54.303 51.717-24.081 51.717-54.303-23.393-54.303-51.717-54.303" />
        <path d="M253.414 0c139.957 0 253.414 113.457 253.414 253.414 0 94.285-51.491 176.544-127.886 220.19-35.728 20.575-77.036 32.582-121.104 33.199l-4.423.025C113.457 506.828 0 393.371 0 253.414S113.457 0 253.414 0m-23.676 346.505c-46.331 0-87.479 29.378-102.607 73.008l-2.339 7.571c35.919 27.232 80.165 42.893 126.504 43.522l5.709-.009c38.24-.62 74.079-11.122 105.072-29.064l19.977-13.243-2.237-6.866c-14.371-44.046-55.062-74.052-101.239-74.901zm23.676-310.303c-119.963 0-217.212 97.249-217.212 217.212 0 57.493 22.337 109.77 58.807 148.624 21.668-55.072 74.965-91.735 134.73-91.735h46.831c59.905 0 113.311 36.835 134.885 92.121 36.686-38.892 59.172-91.325 59.172-149.01-.001-119.963-97.25-217.212-217.213-217.212" />
      </svg>
    ),
  },
  {
    label: "Account Settings",
    icon: (
      <svg
        className="size-4.5 fill-current"
        aria-hidden="true"
        viewBox="0 0 32 32"
      >
        <g>
          <path d="M24.915 3.663a3.15 3.15 0 0 0-2.688-1.554H9.774a3.15 3.15 0 0 0-2.688 1.554L.859 14.446a3.15 3.15 0 0 0 0 3.15l6.227 10.742a3.15 3.15 0 0 0 2.688 1.554h12.453a3.15 3.15 0 0 0 2.688-1.554l6.226-10.784a3.15 3.15 0 0 0 0-3.15zm4.41 12.841-6.227 10.784a1.05 1.05 0 0 1-.871.504H9.774a1.05 1.05 0 0 1-.872-.504L2.676 16.504a1.05 1.05 0 0 1 0-1.05L8.902 4.713a1.05 1.05 0 0 1 .872-.504h12.453a1.05 1.05 0 0 1 .871.504l6.227 10.783a1.05 1.05 0 0 1 0 1.008" />
          <path d="M16 9.7a6.3 6.3 0 1 0 6.3 6.3A6.3 6.3 0 0 0 16 9.7m0 10.5a4.2 4.2 0 1 1 4.2-4.2 4.2 4.2 0 0 1-4.2 4.2" />
        </g>
      </svg>
    ),
  },
  {
    label: "Billing & Payments",
    icon: (
      <svg
        className="size-4.5 fill-current"
        aria-hidden="true"
        viewBox="0 0 512 512"
      >
        <path d="M456 80H56c-30.878 0-56 25.122-56 56v240c0 30.878 25.122 56 56 56h400c30.878 0 56-25.122 56-56V136c0-30.878-25.122-56-56-56M56 112h400c13.233 0 24 10.767 24 24v32H32v-32c0-13.233 10.767-24 24-24m400 288H56c-13.233 0-24-10.767-24-24V200h448v176c0 13.233-10.767 24-24 24" />
        <path d="M112 352H96c-8.836 0-16-7.164-16-16v-16c0-8.836 7.164-16 16-16h16c8.836 0 16 7.164 16 16v16c0 8.836-7.164 16-16 16" />
      </svg>
    ),
  },
  {
    label: "Logout",
    icon: (
      <svg
        className="size-4.5 fill-current"
        aria-hidden="true"
        viewBox="0 0 6.35 6.35"
      >
        <path d="M3.172.292a.289.29 0 0 0-.286.292v2.318a.289.29 0 0 0 .578 0V.584a.289.29 0 0 0-.292-.292m1.683.58a.289.29 0 0 0-.029 0 .289.29 0 0 0-.16.512c.5.426.816 1.06.816 1.772A2.31 2.31 0 0 1 3.176 5.48 2.31 2.31 0 0 1 .87 3.16c0-.709.311-1.339.806-1.766a.289.29 0 1 0-.375-.44 2.9 2.9 0 0 0-1.01 2.203A2.9 2.9 0 0 0 3.178 6.06 2.896 2.896 0 0 0 6.06 3.156 2.9 2.9 0 0 0 5.04.944a.289.29 0 0 0-.185-.072" />
      </svg>
    ),
  },
];

interface HeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export default function Header({
  isSidebarOpen,
  onToggleSidebar,
}: HeaderProps) {
  const [isProfileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    };
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") setProfileOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  return (
    <header className="flex py-2 sticky top-0 w-full bg-white border-b border-slate-300 px-6 dark:border-neutral-700 dark:bg-neutral-900 min-h-[68px] z-20">
      <div className="flex flex-wrap items-center gap-4 w-full">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-expanded={isSidebarOpen}
          className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
        >
          <span className="sr-only">Toggle sidebar menu</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-4.5 fill-slate-900 dark:fill-slate-50"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M.13 17.05a1.41 1.41 0 0 1 1.41-1.41H10a1.41 1.41 0 1 1 0 2.82H1.54a1.41 1.41 0 0 1-1.41-1.41zm0-14.1a1.41 1.41 0 0 1 1.41-1.41h16.92a1.41 1.41 0 1 1 0 2.82H1.54A1.41 1.41 0 0 1 .13 2.95zm0 7.05a1.41 1.41 0 0 1 1.41-1.41h16.92a1.41 1.41 0 1 1 0 2.82H1.54A1.41 1.41 0 0 1 .13 10z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        <h1 className="text-xl text-slate-900 font-bold dark:text-slate-50">
          Dashboard
        </h1>

        <div className="flex items-center flex-wrap gap-5 ml-auto">
          {/* Notification Bell */}
          <a
            href="#"
            className="relative block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          >
            <span className="sr-only">View notifications</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-5 fill-slate-900 dark:fill-slate-50 overflow-visible"
              viewBox="0 0 371.263 371.263"
              aria-hidden="true"
            >
              <path d="M305.402 234.794v-70.54c0-52.396-33.533-98.085-79.702-115.151.539-2.695.838-5.449.838-8.204C226.539 18.324 208.215 0 185.64 0s-40.899 18.324-40.899 40.899c0 2.695.299 5.389.778 7.964-15.868 5.629-30.539 14.551-43.054 26.647-23.593 22.755-36.587 53.354-36.587 86.169v73.115c0 2.575-2.096 4.731-4.731 4.731-22.096 0-40.959 16.647-42.995 37.845-1.138 11.797 2.755 23.533 10.719 32.276 7.904 8.683 19.222 13.713 31.018 13.713h72.217c2.994 26.887 25.869 47.905 53.534 47.905s50.54-21.018 53.534-47.905h72.217c11.797 0 23.114-5.03 31.018-13.713 7.904-8.743 11.797-20.479 10.719-32.276-2.036-21.198-20.958-37.845-42.995-37.845a4.704 4.704 0 0 1-4.731-4.731zM185.64 23.952c9.341 0 16.946 7.605 16.946 16.946 0 .778-.12 1.497-.24 2.275-4.072-.599-8.204-1.018-12.336-1.138-7.126-.24-14.132.24-21.078 1.198-.12-.778-.24-1.497-.24-2.275.002-9.401 7.607-17.006 16.948-17.006zm0 323.358c-14.431 0-26.527-10.3-29.342-23.952h58.683c-2.813 13.653-14.909 23.952-29.341 23.952zm143.655-67.665c.479 5.15-1.138 10.12-4.551 13.892-3.533 3.773-8.204 5.868-13.353 5.868H59.89c-5.15 0-9.82-2.096-13.294-5.868-3.473-3.772-5.09-8.743-4.611-13.892.838-9.042 9.282-16.168 19.162-16.168 15.809 0 28.683-12.874 28.683-28.683v-73.115c0-26.228 10.419-50.719 29.282-68.923 18.024-17.425 41.498-26.887 66.528-26.887 1.198 0 2.335 0 3.533.06 50.839 1.796 92.277 45.929 92.277 98.325v70.54c0 15.809 12.874 28.683 28.683 28.683 9.88 0 18.264 7.126 19.162 16.168z" />
            </svg>
            <span className="absolute top-0 right-0 size-2.5 bg-red-500 rounded-full"></span>
          </a>

          {/* Profile Dropdown */}
          <div className="relative w-max flex flex-col" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen(!isProfileOpen)}
              aria-haspopup="true"
              aria-expanded={isProfileOpen}
              className="border border-slate-300 rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <Image
                src="https://readymadeui.com/team-1.webp"
                alt="profile-pic"
                className="size-9 rounded-full"
                width={36}
                height={36}
              />
            </button>

            <ul
              className={`${
                isProfileOpen ? "block" : "hidden"
              } absolute right-0 top-full mt-2 p-2 space-y-0.5 min-w-48 w-full text-slate-800 text-sm font-medium bg-white border border-slate-300 rounded-md shadow-lg z-20 overflow-hidden dark:text-slate-400 dark:bg-neutral-800 dark:border-neutral-700`}
            >
              {PROFILE_MENU.map((item) => (
                <li key={item.label}>
                  <a
                    href="#"
                    onClick={() => setProfileOpen(false)}
                    className="w-full p-2 flex items-center gap-2.5 rounded-md cursor-pointer transition-colors hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:text-slate-50 dark:hover:bg-neutral-700"
                  >
                    {item.icon}
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
}
