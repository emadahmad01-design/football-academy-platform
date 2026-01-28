import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  // Ensure value is always a valid number between 0 and 100
  let safeValue = 0;
  
  try {
    if (value === undefined || value === null) {
      safeValue = 0;
    } else if (typeof value === 'number') {
      if (Number.isNaN(value)) {
        console.warn('[Progress] Received NaN value, defaulting to 0');
        safeValue = 0;
      } else if (!Number.isFinite(value)) {
        console.warn('[Progress] Received non-finite value:', value, 'defaulting to 0');
        safeValue = 0;
      } else {
        safeValue = Math.max(0, Math.min(100, value));
      }
    } else {
      console.warn('[Progress] Received non-numeric value:', value, typeof value);
      safeValue = 0;
    }
  } catch (error) {
    console.error('[Progress] Error processing value:', error, 'value was:', value);
    safeValue = 0;
  }
  
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
        className
      )}
      value={safeValue}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="bg-primary h-full w-full flex-1 transition-all"
        style={{ transform: `translateX(-${100 - safeValue}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
