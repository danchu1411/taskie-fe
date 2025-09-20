import type { SVGProps } from "react";

export default function ChartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
      {...props}
    >
      <path d="M3 20h18" />
      <rect x="5" y="11" width="3" height="6" rx="1" />
      <rect x="10.5" y="8" width="3" height="9" rx="1" />
      <rect x="16" y="6" width="3" height="11" rx="1" />
    </svg>
  );
}
