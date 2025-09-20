import type { SVGProps } from "react";

export default function TimerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
      {...props}
    >
      <circle cx="12" cy="13" r="9" />
      <path d="M12 13V8m-3-6h6" />
    </svg>
  );
}
