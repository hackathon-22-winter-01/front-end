export class DequeNode<T> {
  public prev: DequeNode<T> | null = null
  public next: DequeNode<T> | null = null
  public value: T
  constructor(value: T) {
    this.value = value
  }
}

export class Deque<T> {
  private _head: DequeNode<T> | null = null
  private _tail: DequeNode<T> | null = null
  private _size: number = 0

  constructor(iterable?: Iterable<T>) {
    if (iterable) {
      for (const value of iterable) {
        this.push(value)
      }
    }
  }

  public get size(): number {
    return this._size
  }

  public get head(): T | undefined {
    return this._head?.value ?? undefined
  }

  public get tail(): T | undefined {
    return this._tail?.value ?? undefined
  }

  public push(value: T): void {
    const node = new DequeNode(value)
    if (this._tail) {
      this._tail.next = node
      node.prev = this._tail
      this._tail = node
    } else {
      this._head = node
      this._tail = node
    }
    this._size++
  }

  public pop(): T | undefined {
    if (this._tail) {
      const value = this._tail.value
      this._tail = this._tail.prev
      if (this._tail) {
        this._tail.next = null
      } else {
        this._head = null
      }
      this._size--
      return value
    }
    return undefined
  }

  public push_front(value: T): void {
    const node = new DequeNode(value)
    if (this._head) {
      this._head.prev = node
      node.next = this._head
      this._head = node
    } else {
      this._head = node
      this._tail = node
    }
    this._size++
  }

  public pop_front(): T | undefined {
    if (this._head === null) {
      return undefined
    }
    const value = this._head.value
    this._head = this._head.next
    if (this._head) {
      this._head.prev = null
    } else {
      this._tail = null
    }
    this._size--
    return value
  }

  public clear(): void {
    this._head = null
    this._tail = null
    this._size = 0
  }

  public *[Symbol.iterator](): Generator<T> {
    let node = this._head
    while (node) {
      yield node.value
      node = node.next
    }
  }

  public toArray(): T[] {
    const array: T[] = []
    let node = this._head
    while (node) {
      array.push(node.value)
      node = node.next
    }
    return array
  }
}
