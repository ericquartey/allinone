/**
 * Priority Queue - Gestione coda con priorità
 * Replica il comportamento della coda EjLog Java
 */

class PriorityQueue {
  constructor() {
    this.items = [];
  }

  enqueue(item, priority) {
    const queueElement = { item, priority, timestamp: new Date() };
    let added = false;

    for (let i = 0; i < this.items.length; i++) {
      if (queueElement.priority > this.items[i].priority) {
        this.items.splice(i, 0, queueElement);
        added = true;
        break;
      } else if (queueElement.priority === this.items[i].priority) {
        if (queueElement.timestamp < this.items[i].timestamp) {
          this.items.splice(i, 0, queueElement);
          added = true;
          break;
        }
      }
    }

    if (!added) {
      this.items.push(queueElement);
    }
  }

  dequeue() {
    if (this.isEmpty()) return null;
    return this.items.shift().item;
  }

  peek() {
    if (this.isEmpty()) return null;
    return this.items[0].item;
  }

  isEmpty() {
    return this.items.length === 0;
  }

  size() {
    return this.items.length;
  }

  clear() {
    this.items = [];
  }

  getAll() {
    return this.items.map(qe => ({ ...qe.item, priority: qe.priority, queuedAt: qe.timestamp }));
  }

  remove(predicate) {
    const index = this.items.findIndex(qe => predicate(qe.item));
    if (index !== -1) {
      this.items.splice(index, 1);
      return true;
    }
    return false;
  }

  find(predicate) {
    const qe = this.items.find(qe => predicate(qe.item));
    return qe ? qe.item : null;
  }
}

export default PriorityQueue;
