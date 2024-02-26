export type AllPartial<T> = T extends Function
    ? T
    : T extends object
    ? {
          [P in keyof T]?: AllPartial<T[P]>
      }
    : T
