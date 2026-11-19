import { SIM_BANNER } from "@/lib/types";

export function SimBanner() {
  return (
    <div className="sim-banner" role="status">
      <span className="sim-banner__icon" aria-hidden="true">
        <svg viewBox="0 0 20 20" width="18" height="18">
          <path
            fill="currentColor"
            d="M7 3h6l.6 2H17a1 1 0 0 1 1 1v2h-2.2A5 5 0 0 0 7.2 8H5V6a1 1 0 0 1 1-1h3.4L7 3zm-2 7h2.08a5 5 0 0 0 8.84 0H17v6a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-6z"
          />
        </svg>
      </span>
      {SIM_BANNER}
    </div>
  );
}
