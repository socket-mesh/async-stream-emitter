import { AsyncStreamEmitter } from "../src/index.js";
import { beforeEach, afterEach, describe, it, expect } from '@jest/globals';

let pendingTimeoutSet = new Set<NodeJS.Timeout>();

function wait(duration: number): Promise<void> {
  return new Promise((resolve) => {
    let timeout = setTimeout(() => {
      pendingTimeoutSet.clear();
      resolve();
    }, duration);
    pendingTimeoutSet.add(timeout);
  });
}

function cancelAllPendingWaits() {
	for (let timeout of pendingTimeoutSet) {
		clearTimeout(timeout);
	}
}

describe('AsyncStreamEmitter', () => {
	let streamEmitter: AsyncStreamEmitter<string>;
	let packets: string[];

	beforeEach(async () => {
		packets = [];
		streamEmitter = new AsyncStreamEmitter<string>();
	});

	afterEach(async () => {
		cancelAllPendingWaits();
	});

  it('should support listener method which can consume emitted events and which is cleaned up after closing', async () => {
    expect(!!streamEmitter.emit).toBe(true);

    (async () => {
      for (let i = 0; i < 5; i++) {
        await wait(20);
        streamEmitter.emit('foo', 'hello' + i);
      }
      streamEmitter.closeListeners('foo');
    })();

    for await (let event of streamEmitter.listen('foo')) {
      packets.push(event);
    }

    let expectedEvents = [
      'hello0',
      'hello1',
      'hello2',
      'hello3',
      'hello4'
    ];

    expect(packets.join(',')).toBe(expectedEvents.join(','));
  });

  it('should stop consuming specified events after the closeAllListeners method is invoked', async () => {
    (async () => {
      for await (let event of streamEmitter.listen('foo')) {
        packets.push(event);
      }
    })();

    (async () => {
      for await (let event of streamEmitter.listen('bar')) {
        packets.push(event);
      }
    })();

    for (let i = 0; i < 5; i++) {
      await wait(20);
      streamEmitter.emit('foo', 'hello' + i);
    }

    let fooStatsList = streamEmitter.getListenerConsumerStats('foo');
    let barStatsList = streamEmitter.getListenerConsumerStats('bar');

    expect(fooStatsList.length).toBe(1);
    expect(barStatsList.length).toBe(1);

    streamEmitter.closeListeners();

    await wait(0);

    fooStatsList = streamEmitter.getListenerConsumerStats('foo');
    barStatsList = streamEmitter.getListenerConsumerStats('bar');

    expect(JSON.stringify(fooStatsList)).toBe('[]');
    expect(JSON.stringify(barStatsList)).toBe('[]');
  });

  it('should return a consumer stats object when the getListenerConsumerStats method is called', async () => {
    let fooConsumer = streamEmitter.listen('foo').createConsumer();

    (async () => {
      for await (let event of fooConsumer) {
        packets.push(event);
      }
    })();

    (async () => {
      for await (let event of streamEmitter.listen('bar')) {
        packets.push(event);
      }
    })();

    let fooStats = streamEmitter.getListenerConsumerStats(fooConsumer.id);

    expect(fooStats).not.toBe(null);
    expect(fooStats.backpressure).toBe(0);
    expect(fooStats.stream).toBe('foo');
  });

  it('should return a list of consumer stats when the getListenerConsumerStatsList method is called', async () => {
    let fooConsumerA = streamEmitter.listen('foo').createConsumer();
    let fooConsumerB = streamEmitter.listen('foo').createConsumer();
    let barConsumer = streamEmitter.listen('bar').createConsumer();

    (async () => {
      for await (let event of fooConsumerA) {
        packets.push(event);
      }
    })();
    (async () => {
      for await (let event of fooConsumerB) {
        packets.push(event);
      }
    })();
    (async () => {
      for await (let event of barConsumer) {
        packets.push(event);
      }
    })();

    let fooStatsList = streamEmitter.getListenerConsumerStats('foo');
    let barStatsList = streamEmitter.getListenerConsumerStats('bar');

    expect(fooStatsList).not.toBe(null);
    expect(fooStatsList.length).toBe(2);
    expect(fooStatsList[0].stream).toBe('foo');
    expect(fooStatsList[0].backpressure).toBe(0);
    expect(fooStatsList[1].stream).toBe('foo');
    expect(fooStatsList[1].backpressure).toBe(0);
    expect(barStatsList).not.toBe(null);
    expect(barStatsList.length).toBe(1);
    expect(barStatsList[0].backpressure).toBe(0);
    expect(barStatsList[0].stream).toBe('bar');
  });

  it('should return a complete list of consumer stats when the getAllListenersConsumerStatsList method is called', async () => {
    (async () => {
      for await (let event of streamEmitter.listen('foo')) {
        packets.push(event);
      }
    })();
    (async () => {
      for await (let event of streamEmitter.listen('foo')) {
        packets.push(event);
      }
    })();
    (async () => {
      for await (let event of streamEmitter.listen('bar')) {
        packets.push(event);
      }
    })();

    let allStatsList = streamEmitter.getListenerConsumerStats();

    expect(allStatsList).not.toBe(null);
    expect(allStatsList.length).toBe(3);
    // Check that each ID is unique.
    expect([...new Set(allStatsList.map(stats => stats.id))].length).toBe(3);
  });

  it('should stop consuming on the specified listeners after the killListener method is called', async () => {
    let ended: string[] = [];

    (async () => {
      for await (let event of streamEmitter.listen('foo')) {
        packets.push(event);
      }
      ended.push('foo');
    })();

    (async () => {
      for await (let event of streamEmitter.listen('bar')) {
        packets.push(event);
      }
      ended.push('bar');
    })();

    for (let i = 0; i < 5; i++) {
      await wait(20);
      streamEmitter.emit('foo', 'hello' + i);
      streamEmitter.emit('bar', 'hi' + i);
    }
    streamEmitter.killListeners('bar');

    await wait(0);

    let allStatsList = streamEmitter.getListenerConsumerStats();

    expect(ended.length).toBe(1);
    expect(ended[0]).toBe('bar');
    expect(allStatsList.length).toBe(1);
    expect(allStatsList[0].stream).toBe('foo');
  });

  it('should stop consuming on all listeners after the killAllListeners method is called', async () => {
    let ended: string[] = [];

    (async () => {
      for await (let event of streamEmitter.listen('foo')) {
        packets.push(event);
      }
      ended.push('foo');
    })();

    (async () => {
      for await (let event of streamEmitter.listen('bar')) {
        packets.push(event);
      }
      ended.push('bar');
    })();

    for (let i = 0; i < 5; i++) {
      await wait(20);
      streamEmitter.emit('foo', 'hello' + i);
      streamEmitter.emit('bar', 'hi' + i);
    }
    streamEmitter.killListeners();

    await wait(0);

    let allStatsList = streamEmitter.getListenerConsumerStats();

    expect(ended.length).toBe(2);
    expect(ended[0]).toBe('foo');
    expect(ended[1]).toBe('bar');
    expect(allStatsList.length).toBe(0);
  });

  it('should stop consuming by a specific consumer after the killListenerConsumer method is called', async () => {
    let ended: string[] = [];

    (async () => {
      for await (let event of streamEmitter.listen('bar')) {
        packets.push(event);
      }
      ended.push('bar');
    })();

    let fooConsumer = streamEmitter.listen('foo').createConsumer();

    (async () => {
      for await (let event of fooConsumer) {
        packets.push(event);
      }
      ended.push('foo');
    })();

    streamEmitter.killListeners(fooConsumer.id);

    await wait(0);

    let allStatsList = streamEmitter.getListenerConsumerStats();

    expect(ended.length).toBe(1);
    expect(ended[0]).toBe('foo');
    expect(allStatsList.length).toBe(1);
    expect(allStatsList[0].stream).toBe('bar');
  });

  it('should return the backpressure of the specified event when the getListenerBackpressure method is called', async () => {
    (async () => {
      for await (let event of streamEmitter.listen('foo')) {
        packets.push(event);
        await wait(300);
      }
    })();

    for (let i = 0; i < 5; i++) {
      streamEmitter.emit('foo', 'test' + i);
    }

    expect(streamEmitter.getListenerBackpressure('foo')).toBe(5);
    await wait(0);
    expect(streamEmitter.getListenerBackpressure('foo')).toBe(4);
    await wait(100);
    expect(streamEmitter.getListenerBackpressure('foo')).toBe(4);

		// Kill all listeners so the test dosn't hang
		streamEmitter.killListeners();
  });

  it('should return the max backpressure of all events when the getAllListenersBackpressure method is called', async () => {
    (async () => {
      for await (let event of streamEmitter.listen('foo')) {
        packets.push(event);
        await wait(300);
      }
    })();
    (async () => {
      for await (let event of streamEmitter.listen('bar')) {
        packets.push(event);
        await wait(300);
      }
    })();

    for (let i = 0; i < 5; i++) {
      streamEmitter.emit('foo', 'test' + i);
      streamEmitter.emit('bar', 'hello' + i);
      streamEmitter.emit('bar', 'hi' + i);
    }

    expect(streamEmitter.getListenerBackpressure()).toBe(10);
    await wait(0);
    expect(streamEmitter.getListenerBackpressure()).toBe(9);

		// Kill all listeners so the test dosn't hang
		streamEmitter.killListeners();
  });

  it('should return the backpressure of the specified consumer when getListenerConsumerBackpressure method is called', async () => {
    let fooConsumer = streamEmitter.listen('foo').createConsumer();
    (async () => {
      for await (let event of fooConsumer) {
        packets.push(event);
        await wait(300);
      }
    })();
    (async () => {
      for await (let event of streamEmitter.listen('bar')) {
        packets.push(event);
        await wait(300);
      }
    })();

    for (let i = 0; i < 5; i++) {
      streamEmitter.emit('foo', 'test' + i);
      streamEmitter.emit('bar', 'hello' + i);
    }

    expect(streamEmitter.getListenerBackpressure(fooConsumer.id)).toBe(5);
    await wait(0);
    expect(streamEmitter.getListenerBackpressure(fooConsumer.id)).toBe(4);

		// Kill all listeners so the test dosn't hang
		streamEmitter.killListeners();
  });

  it('should return the correct boolean when hasListenerConsumer method is called', async () => {
    let fooConsumer = streamEmitter.listen('foo').createConsumer();
    (async () => {
      for await (let event of fooConsumer) {
        packets.push(event);
        await wait(300);
      }
    })();
    expect(streamEmitter.hasListenerConsumer('foo', fooConsumer.id)).toBe(true);
    expect(streamEmitter.hasListenerConsumer('bar', fooConsumer.id)).toBe(false);
    expect(streamEmitter.hasListenerConsumer('foo', 9)).toBe(false);
  });

  it('should return the correct boolean when hasAnyListenerConsumer method is called', async () => {
    let fooConsumer = streamEmitter.listen('foo').createConsumer();
    (async () => {
      for await (let event of fooConsumer) {
        packets.push(event);
        await wait(300);
      }
    })();
    expect(streamEmitter.hasListenerConsumer(fooConsumer.id)).toBe(true);
    expect(streamEmitter.hasListenerConsumer(9)).toBe(false);
  });

  it('should stop consuming processing a specific event after a listener is removed with the removeListener method', async () => {
    let ended: string[] = [];

    (async () => {
      for await (let event of streamEmitter.listen('bar')) {
        packets.push(event);
      }
      ended.push('bar');
    })();

    for (let i = 0; i < 5; i++) {
      streamEmitter.emit('bar', 'a' + i);
    }

    streamEmitter.removeListener('bar');
    await wait(0);
    streamEmitter.listen('bar').once();

    for (let i = 0; i < 5; i++) {
      streamEmitter.emit('bar', 'b' + i);
    }

    await wait(0);

    expect(packets).not.toBe(null);
    expect(packets.length).toBe(5);
    expect(packets[0]).toBe('a0');
    expect(packets[4]).toBe('a4');
    expect(ended.length).toBe(0);
  });
});
