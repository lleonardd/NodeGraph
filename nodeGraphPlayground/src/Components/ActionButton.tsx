
export function ActionButton({ onClick, Title, className }: { onClick: () => void, Title: string, className?: string }) {
    return (
        <button className={"mr-2 bg-cyan-700 hover:bg-cyan-800 active:bg-cyan-600 mb-2 px-3 py-1 rounded-full text-white " + className} onClick={onClick}>
            {Title}
        </button>
    )
}