// @flow

// Goals
// - Reimplement using a `Map<Hash<T>, T>` or `CircularArray<T>` for "sick perf gains".

// Queue's three main operations:
//   `enqueue(T): void` adds an element to the end
//   `dequeue(): T | null` removes the oldest existing element from the start
//   `peek(): T | null` returns the oldest element but does not remove it
export default class Queue<T: any> {
  state: Array<T>

  constructor(initialState?: Array<T>) {
    this.state = initialState || []
  }

  enqueue(t: T): void {
    this.state.push(t)
  }

  dequeue(): T | null {
    if (this.state.length === 0) {
      return null
    }

    let dequeued = this.state[0]
    this.state = this.state.slice(1)

    return dequeued
  }

  peek(): T | null {
    if (this.state.length === 0) {
      return null
    }

    return this.state[0]
  }

  clear(): void {
    this.state = []
  }

  clone(): Queue<T> {
    return new Queue(this.state.slice(0))
  }

  asArray(): Array<T> {
    return this.state.slice(0)
  }
}
