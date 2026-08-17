import Image from "next/image";
import React from "react";

const NAVIGATION_ITEMS = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="size-4.5 fill-current overflow-visible"
        viewBox="0 0 512 512"
        aria-hidden="true"
      >
        <path d="M426 495.983H86c-25.364 0-46-20.635-46-46v-242.02c0-8.836 7.163-16 16-16s16 7.164 16 16v242.02c0 7.72 6.28 14 14 14h340c7.72 0 14-6.28 14-14v-242.02c0-8.836 7.163-16 16-16s16 7.164 16 16v242.02c0 25.364-20.635 46-46 46" />
        <path d="M496 263.958a15.95 15.95 0 0 1-11.313-4.687L285.698 60.284c-16.375-16.376-43.02-16.376-59.396 0L27.314 259.272c-6.248 6.249-16.379 6.249-22.627 0-6.249-6.248-6.249-16.379 0-22.627L203.675 37.656c28.852-28.852 75.799-28.852 104.65 0l198.988 198.988c6.249 6.249 6.249 16.379 0 22.627A15.94 15.94 0 0 1 496 263.958M320 495.983H192c-8.837 0-16-7.164-16-16v-142c0-27.57 22.43-50 50-50h60c27.57 0 50 22.43 50 50v142c0 8.836-7.163 16-16 16m-112-32h96v-126c0-9.925-8.075-18-18-18h-60c-9.925 0-18 8.075-18 18z" />
      </svg>
    ),
  },
  {
    id: "information",
    label: "Information",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="size-4.5 fill-current overflow-visible"
        viewBox="0 0 512 512"
        aria-hidden="true"
      >
        <path d="M256 0C114.497 0 0 114.507 0 256c0 141.503 114.507 256 256 256 141.503 0 256-114.507 256-256C512 114.497 397.492 0 256 0m0 472c-119.393 0-216-96.615-216-216 0-119.393 96.615-216 216-216 119.393 0 216 96.615 216 216 0 119.393-96.616 216-216 216" />
        <path d="M256 214.33c-11.046 0-20 8.954-20 20v128.793c0 11.046 8.954 20 20 20s20-8.955 20-20.001V234.33c0-11.046-8.954-20-20-20" />
        <circle cx="256" cy="162.84" r="27" />
      </svg>
    ),
  },
  {
    id: "income",
    label: "Income",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="size-4.5 fill-current overflow-visible"
        viewBox="0 0 507.246 507.246"
        aria-hidden="true"
      >
        <path d="M457.262 89.821c-2.734-35.285-32.298-63.165-68.271-63.165H68.5c-37.771 0-68.5 30.729-68.5 68.5V412.09c0 37.771 30.729 68.5 68.5 68.5h370.247c37.771 0 68.5-30.729 68.5-68.5V155.757c-.001-31.354-21.184-57.836-49.985-65.936M68.5 58.656h320.492c17.414 0 32.008 12.261 35.629 28.602H68.5c-13.411 0-25.924 3.889-36.5 10.577v-2.679c0-20.126 16.374-36.5 36.5-36.5M438.746 448.59H68.5c-20.126 0-36.5-16.374-36.5-36.5V155.757c0-20.126 16.374-36.5 36.5-36.5h370.247c20.126 0 36.5 16.374 36.5 36.5v55.838H373.221c-40.43 0-73.322 32.893-73.322 73.323s32.893 73.323 73.322 73.323h102.025v53.849c0 20.126-16.374 36.5-36.5 36.5m36.5-122.349H373.221c-22.785 0-41.322-18.537-41.322-41.323s18.537-41.323 41.322-41.323h102.025z" />
        <circle cx="379.16" cy="286.132" r="16.658" />
      </svg>
    ),
  },
  {
    id: "actions",
    label: "Actions",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="size-4.5 fill-current overflow-visible"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <g fillRule="evenodd" clipRule="evenodd">
          <path d="M.202 12C.202 5.484 5.484.203 12 .203a.907.907 0 0 1 0 1.815A9.982 9.982 0 1 0 21.982 12a.907.907 0 0 1 1.815 0c0 6.516-5.281 11.797-11.797 11.797S.202 18.516.202 12" />
          <path d="M5.647 12A6.35 6.35 0 0 1 12 5.648a.907.907 0 0 1 0 1.814A4.537 4.537 0 1 0 16.537 12a.907.907 0 0 1 1.815 0 6.352 6.352 0 1 1-12.705 0" />
          <path d="M16.453 7.544a.907.907 0 0 1 0 1.282l-3.812 3.815a.907.907 0 0 1-1.282-1.282l3.811-3.815a.907.907 0 0 1 1.283 0" />
          <path d="M19.427.271a.91.91 0 0 1 .561.839v2.904h2.902a.907.907 0 0 1 .642 1.549l-3.25 3.267a.9.9 0 0 1-.645.266h-3.826a.907.907 0 0 1-.907-.907V4.393a.9.9 0 0 1 .264-.64L18.438.47a.91.91 0 0 1 .989-.199m-2.708 4.497V7.28h2.541l1.446-1.452H19.08a.907.907 0 0 1-.908-.908V3.307z" />
        </g>
      </svg>
    ),
  },
  {
    id: "posts",
    label: "Posts",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="size-4.5 fill-current overflow-visible"
        viewBox="0 0 28 28"
        aria-hidden="true"
      >
        <g transform="translate(-1.68 -1.68)scale(1.12)">
          <path d="M20 26H8c-3.3 0-6-2.7-6-6V8c0-3.3 2.7-6 6-6h12c3.3 0 6 2.7 6 6v12c0 3.3-2.7 6-6 6M8 4C5.8 4 4 5.8 4 8v12c0 2.2 1.8 4 4 4h12c2.2 0 4-1.8 4-4V8c0-2.2-1.8-4-4-4zm6 16c-.6 0-1-.4-1-1v-4H9c-.6 0-1-.4-1-1s.4-1 1-1h4V9c0-.6.4-1 1-1s1 .4 1 1v4h4c.6 0 1 .4 1 1s-.4 1-1 1h-4v4c0 .6-.4 1-1 1" />
        </g>
      </svg>
    ),
  },
  {
    id: "schedules",
    label: "Schedules",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="size-4.5 fill-current overflow-visible"
        viewBox="0 0 512 512"
        aria-hidden="true"
      >
        <path d="m347.216 301.211-71.387-53.54V138.609c0-10.966-8.864-19.83-19.83-19.83s-19.83 8.864-19.83 19.83v118.978c0 6.246 2.935 12.136 7.932 15.864l79.318 59.489a19.7 19.7 0 0 0 11.878 3.966c6.048 0 11.997-2.717 15.884-7.952 6.585-8.746 4.8-21.179-3.965-27.743" />
        <path d="M256 0C114.833 0 0 114.833 0 256s114.833 256 256 256 256-114.833 256-256S397.167 0 256 0m0 472.341c-119.275 0-216.341-97.066-216.341-216.341S136.725 39.659 256 39.659c119.295 0 216.341 97.066 216.341 216.341S375.275 472.341 256 472.341" />
      </svg>
    ),
  },
  {
    id: "refunds",
    label: "Refunds",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="size-4.5 fill-current overflow-visible"
        viewBox="0 0 64 64"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M14.6 6.688c-7.29 0-13.2 5.862-13.2 13.092V41.6c0 7.23 5.91 13.092 13.2 13.092h24.2a2.2 2.182 0 1 0 0-4.364H14.6A8.8 8.728 0 0 1 5.8 41.6V24.144h52.8v7.637a2.2 2.182 0 1 0 4.4 0V19.78c0-7.23-5.91-13.092-13.2-13.092zm44 13.092H5.8a8.8 8.728 0 0 1 8.8-8.728h35.2a8.8 8.728 0 0 1 8.8 8.728"
          clipRule="evenodd"
        />
        <path d="M63 45.964a8.8 8.728 0 0 0-8.8-8.728H38.8a2.2 2.182 0 1 0 0 4.364h15.4a4.4 4.364 0 0 1 0 8.728h-1.84l.645-.64a2.2 2.182 0 1 0-3.11-3.085l-4.4 4.364a2.2 2.182 0 0 0 0 3.085l4.4 4.364a2.2 2.182 0 1 0 3.11-3.085l-.644-.64H54.2a8.8 8.728 0 0 0 8.8-8.727M12.4 28.508a2.2 2.182 0 1 0 0 4.364h8.8a2.2 2.182 0 1 0 0-4.364z" />
      </svg>
    ),
  },
  {
    id: "profile",
    label: "Profile",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="size-4.5 fill-current overflow-visible"
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
        className="size-4.5 fill-current overflow-visible"
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
        isOpen ? "w-66 min-w-66 opacity-100" : "w-0 min-w-0 opacity-0"
      } overflow-hidden transition-all duration-300 ease-in-out`}
      aria-label="Sidebar navigation"
    >
      <div className="fixed top-0 left-0 w-66 h-full flex flex-col overflow-auto py-6 px-4 bg-white dark:bg-neutral-900 border-r border-slate-300 dark:border-neutral-700">
        <div className="mb-6">
          <a
            href="#"
            className="min-h-9 inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          >
            <span className="sr-only">Your Company</span>
            <Image
              src="https://readymadeui.com/readymadeui.svg"
              alt="logo"
              className="w-36 block dark:invert dark:brightness-100"
              width={144}
              height={48}
            />
          </a>

          {/* Search Box */}
          <form
            role="search"
            id="searchBox"
            className="flex items-center gap-2.5 mt-4 px-3 py-2.5 rounded-md bg-white dark:bg-neutral-800 outline-1 -outline-offset-1 outline-slate-300 dark:outline-neutral-700 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-blue-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 192.904 192.904"
              className="size-4 fill-slate-400"
              aria-hidden="true"
            >
              <path d="m190.707 180.101-47.078-47.077c11.702-14.072 18.752-32.142 18.752-51.831C162.381 36.423 125.959 0 81.191 0 36.422 0 0 36.423 0 81.193c0 44.767 36.422 81.187 81.191 81.187 19.688 0 37.759-7.049 51.831-18.751l47.079 47.078a7.474 7.474 0 0 0 5.303 2.197 7.498 7.498 0 0 0 5.303-12.803zM15 81.193C15 44.694 44.693 15 81.191 15c36.497 0 66.189 29.694 66.189 66.193 0 36.496-29.692 66.187-66.189 66.187C44.693 147.38 15 117.689 15 81.193z"></path>
            </svg>
            <input
              type="search"
              placeholder="Search..."
              className="text-sm text-slate-900 dark:text-slate-50 w-full outline-none bg-transparent"
            />
          </form>
        </div>

        <nav className="flex-1" aria-label="Primary sidebar navigation">
          <ul className="space-y-2 text-sm text-slate-800 dark:text-slate-400 font-medium">
            {NAVIGATION_ITEMS.map((item) => (
              <li key={item.id}>
                <a
                  href="#"
                  className="flex items-center gap-2.5 hover:text-slate-900 hover:bg-slate-100 rounded-md px-3 py-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:text-slate-50 dark:hover:bg-neutral-800"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <a
          href="#"
          className="flex flex-wrap items-center gap-4 rounded-md mt-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Image
            src="https://readymadeui.com/team-2.webp"
            className="w-10 h-10 rounded-md border border-slate-300 dark:border-neutral-700"
            alt="User avatar"
            width={40}
            height={40}
          />
          <div>
            <p className="text-sm text-slate-800 dark:text-slate-400 font-medium">
              John Doe
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Active free account</p>
          </div>
        </a>
      </div>
    </aside>
  );
}
