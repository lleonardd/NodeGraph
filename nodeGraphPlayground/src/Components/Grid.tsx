import React from "react"

export function Grid({ cols, children }: { cols: number, children: React.ReactNode }) {
    return (
        <div
            className={`grid grid-cols-${cols} gap-4`}
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
            {children}
        </div>
    )
}