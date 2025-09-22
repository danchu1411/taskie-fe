import React from "react";
import type { PriorityValue } from "../../lib/types";
import { PRIORITY } from "../../lib/types";
import { COLORS, COMPONENT_STYLES } from "../../lib/design-tokens";
import { clsx } from "../../lib/utils";

interface PriorityBadgeProps {
  priority: PriorityValue;
  className?: string;
}

export default function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  if (!priority) return null;

  const priorityConfig = {
    [PRIORITY.MUST]: { 
      label: "Must", 
      colors: COLORS.priority.must,
    },
    [PRIORITY.SHOULD]: { 
      label: "Should", 
      colors: COLORS.priority.should,
    },
    [PRIORITY.WANT]: { 
      label: "Want", 
      colors: COLORS.priority.want,
    },
  };

  const config = priorityConfig[priority];

  return (
    <span className={clsx(
      COMPONENT_STYLES.badge.base,
      config.colors.bg,
      config.colors.text,
      config.colors.border,
      className
    )}>
      <span className={clsx("h-2 w-2 rounded-full", config.colors.dot)} />
      {config.label}
    </span>
  );
}

export { PRIORITY };
