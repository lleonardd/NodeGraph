export function genId(length = 10) {
    let id = ""
    const characters = "0123456789abcdefghijklmnopqrstuvwxyz"
    for (let i = 0; i < length; i++) {
        id = id + characters[Math.floor(characters.length * Math.random())]
    }
    return id
}

export function arraysEqualById(a: any[], b: any[]): boolean {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
        if (a[i].id !== b[i].id) return false
    }
    return true
}

export function getFadedColorFromHex({ hexColor, amount }: { hexColor: string, amount: number }) {
    let r = parseInt(hexColor.slice(1, 3), 16),
        g = parseInt(hexColor.slice(3, 5), 16),
        b = parseInt(hexColor.slice(5, 7), 16)

    return `rgba(${r}, ${g}, ${b}, ${amount})` // Use 'amount' directly as opacity
}
