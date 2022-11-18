import * as moment from 'moment'

enum IntervalUnit {
  'second',
  'minute',
  'hour',
  'day',
  'week',
}
export const timeWithUnit = (time: [number, keyof typeof IntervalUnit]) => time[0] * [1e3, 6e4, 36e5, 864e5, 6048e5][IntervalUnit[time[1]]]

export const momentAgo = (time: [number, moment.unitOfTime.DurationConstructor]) =>
  moment()
    .subtract(...time)
    .valueOf()

export const formatDuration = (duration: number) => {
  const minute = Math.trunc((duration /= 60e3) % 60)
  const hour = Math.trunc((duration /= 60) % 24)
  const day = Math.trunc((duration /= 24) % 7)
  const week = Math.trunc(duration / 7)
  const format = (time: number, unit: string) => (!time ? '' : time.toString().endsWith('1') ? time + ' ' + unit : time + ' ' + unit + 's')
  return [format(week, 'week'), format(day, 'day'), format(hour, 'hour'), format(minute, 'minute')].filter(Boolean).join(' ')
}

declare global {
  type O<T = any> = Record<string, T>
  interface String {
    section(from: string, to: string, left?: number, right?: number): string | undefined
    toJSON(): { [key: string | number]: any } | undefined
    hashCode(): number
    similarity(s: string, caseSensitive?: boolean): number
  }
  interface Promise<T> {
    resolve(): PromiseResolve<T>
  }
  type PromiseResolve<T = unknown> = (value: T) => void
  interface Array<T> {
    /**
     * Returns a new shuffled array.
     */
    shuffle(): Array<T>
    /**
     * Returns a new array of unique elements.
     */
    unique(): Array<T>
    /**
     * Returns a new array of defined elements.
     */
    defined(): Array<Exclude<Exclude<T, undefined>, null>>
    get last(): T
  }
  interface ObjectConstructor {
    areEqual(x: object, y: object): boolean
  }
}

Object.defineProperty(Array.prototype, 'last', {
  get: function last() {
    return this[this.length - 1]
  },
})

/**
 * Pauses a thread for a set amount of time.
 * @param milliseconds A number of milliseconds.
 */
export const sleep = (milliseconds: number) => new Promise<undefined>((r) => setTimeout(r, milliseconds))

String.prototype.toJSON = function () {
  try {
    return JSON.parse(this)
  } catch {
    return
  }
}

String.prototype.section = function (from, to, left = 0, right = 0) {
  let i = this.indexOf(from)
  if (!~i) return
  const r = this.substring(i + from.length + left)
  if (!~(i = r.indexOf(to))) return
  return r.substring(0, i + right)
}

String.prototype.hashCode = function () {
  let hash = 0
  if (this.length === 0) return hash
  for (let i = 0; i < this.length; i++) {
    hash = (hash << 5) - hash + this.charCodeAt(i)
    hash |= 0
  }
  return hash
}

Object.areEqual = function (x, y) {
  return objectsAreEqual(x, y)
}

function objectsAreEqual(x: any, y: any): boolean {
  if (x === null || x === undefined || y === null || y === undefined) return x === y
  if (x.constructor !== y.constructor) return false
  if (x instanceof Function) return x === y
  if (x instanceof RegExp) return x === y
  if (x === y || x.valueOf() === y.valueOf()) return true
  if (Array.isArray(x) && x.length !== y.length) return false
  if (x instanceof Date) return false
  if (!(x instanceof Object)) return false
  if (!(y instanceof Object)) return false
  const p = Object.keys(x)
  return (
    Object.keys(y).every(function (i) {
      return p.indexOf(i) !== -1
    }) &&
    p.every(function (i) {
      return objectsAreEqual(x[i], y[i])
    })
  )
}

String.prototype.similarity = function (s, caseSensitive = true) {
  let longer = this.toString(),
    shorter = s
  if (this.length < s.length) {
    longer = s
    shorter = this.toString()
  }
  const longerLength = longer.length
  if (longerLength === 0) return 1
  return (longerLength - _diffs(longer, shorter, caseSensitive)) / longerLength
}

const _diffs = (s1: string, s2: string, caseSensitive: boolean) => {
  if (caseSensitive) {
    s1 = s1.toLowerCase()
    s2 = s2.toLowerCase()
  }
  const a: number[] = []
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i
    for (let j = 0; j <= s2.length; j++) {
      if (i == 0) a[j] = j
      else {
        if (j > 0) {
          let newValue = a[j - 1]
          if (s1.charAt(i - 1) != s2.charAt(j - 1)) newValue = Math.min(Math.min(newValue, lastValue), a[j]) + 1
          a[j - 1] = lastValue
          lastValue = newValue
        }
      }
    }
    if (i > 0) a[s2.length] = lastValue
  }
  return a[s2.length]
}

Object.defineProperty(Array.prototype, 'unique', {
  value: function () {
    return (this as any[]).filter((x, i, a) => a.indexOf(x) === i)
  },
})

Object.defineProperty(Array.prototype, 'defined', {
  value: function () {
    return (this as any[]).filter(Boolean)
  },
})

Object.defineProperty(Array.prototype, 'shuffle', {
  value: function () {
    const result = [...this]
    for (let m = result.length; m; ) {
      const i = Math.floor(Math.random() * m--)
      ;[result[m], result[i]] = [result[i], result[m]]
    }
    return result
  },
})
