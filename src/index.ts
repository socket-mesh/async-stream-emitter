import { DemuxedConsumableStream, StreamDemux, StreamDemuxStats } from "@socket-mesh/stream-demux";

export class AsyncStreamEmitter<T> {
	private _listenerDemux: StreamDemux<T>;

	constructor() {
  	this._listenerDemux = new StreamDemux<T>();
	}

	emit(eventName: string, data: T): void {
		this._listenerDemux.write(eventName, data);
	}

	listen(eventName: string): DemuxedConsumableStream<T> {
		return this._listenerDemux.stream(eventName);
	}

	closeListeners(): void
	closeListeners(eventName: string): void;
	closeListeners(eventName?: string): void {
		if (eventName === undefined) {
			this._listenerDemux.closeAll();
			return;
		}

		this._listenerDemux.close(eventName);
	}

	getListenerConsumerStats(): StreamDemuxStats[];
	getListenerConsumerStats(eventName: string): StreamDemuxStats[];
	getListenerConsumerStats(consumerId: number): StreamDemuxStats;
	getListenerConsumerStats(consumerId?: number | string): StreamDemuxStats | StreamDemuxStats[] {
		return this._listenerDemux.getConsumerStats(consumerId as any);
	}

	getListenerConsumerCount(eventName?: string): number {
		return this._listenerDemux.getConsumerCount(eventName);
	}

	killListeners(): void;
	killListeners(consumerId: number): void;
	killListeners(eventName: string): void;
	killListeners(eventName?: string | number): void {
		if (eventName === undefined) {
			this._listenerDemux.killAll();
			return;
		}

		this._listenerDemux.kill(eventName as any);
	}

	getListenerBackpressure(): number;
	getListenerBackpressure(eventName: string): number;
	getListenerBackpressure(consumerId: number): number;
	getListenerBackpressure(eventName?: string | number): number {
		return this._listenerDemux.getBackpressure(eventName as any);
	}

	hasListenerConsumer(consumerId: number): boolean;
	hasListenerConsumer(eventName: string, consumerId: number): boolean;
	hasListenerConsumer(eventName: string | number, consumerId?: number) {
		return this._listenerDemux.hasConsumer(eventName as any, consumerId!);
	}
}