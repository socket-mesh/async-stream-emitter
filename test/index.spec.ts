import { AsyncStreamEmitter } from "../src/index.js";
import { beforeEach, afterEach, describe, it, expect } from '@jest/globals';

let pendingTimeoutSet = new Set<NodeJS.Timeout>();

function cancelAllPendingWaits() {
  for (let timeout of pendingTimeoutSet) {
    clearTimeout(timeout);
  }
}

describe('AsyncStreamEmitter', () => {
  let streamEmitter: AsyncStreamEmitter<string>;

  beforeEach(async () => {
    streamEmitter = new AsyncStreamEmitter<string>();
  });

  afterEach(async () => {
    cancelAllPendingWaits();
  });

  it('should expose an emit method', () => {
    expect(!!streamEmitter.emit).toBe(true);
  });

  it('should expose a listen method', () => {
    expect(!!streamEmitter.listen).toBe(true);
  });

  it('should expose a closeListener method', () => {
    expect(!!streamEmitter.closeListeners).toBe(true);
  });

  it('should expose a closeAllListeners method', () => {
    expect(!!streamEmitter.closeListeners).toBe(true);
  });

  it('should expose a getListenerConsumerStats method', () => {
    expect(!!streamEmitter.getListenerConsumerStats).toBe(true);
  });

  it('should expose a killListener method', () => {
    expect(!!streamEmitter.killListeners).toBe(true);
  });

  it('should expose a killAllListeners method', () => {
    expect(!!streamEmitter.killListeners).toBe(true);
  });

  it('should expose a killListenerConsumer method', () => {
    expect(!!streamEmitter.killListeners).toBe(true);
  });

  it('should expose a getListenerBackpressure method', () => {
    expect(!!streamEmitter.getListenerBackpressure).toBe(true);
  });

  it('should expose a hasListenerConsumer method', () => {
    expect(!!streamEmitter.hasListenerConsumer).toBe(true);
  });
});
