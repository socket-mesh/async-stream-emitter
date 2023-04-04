import { DemuxedConsumableStream, StreamDemux, StreamDemuxStats } from "@socket-mesh/stream-demux";

export class AsyncStreamEmitter<T> {
	private _listenerDemux: StreamDemux<T>;

	constructor() {
  	this._listenerDemux = new StreamDemux<T>();
	}

	emit(eventName: string, data: T): void {
		this._listenerDemux.write(eventName, data);
	};

	listener(eventName: string): DemuxedConsumableStream<T, T> {
		return this._listenerDemux.stream(eventName);
	};

	closeListener(eventName: string): void {
		this._listenerDemux.close(eventName);
	};

	closeAllListeners(): void {
		this._listenerDemux.closeAll();
	};

	getListenerConsumerStats(): StreamDemuxStats[];
	getListenerConsumerStats(eventName: string): StreamDemuxStats[];
	getListenerConsumerStats(consumerId: number): StreamDemuxStats;
	getListenerConsumerStats(consumerId?: number | string): StreamDemuxStats | StreamDemuxStats[] {
		return this._listenerDemux.getConsumerStats(consumerId as any);
	};

	getListenerConsumerCount(eventName?: string): number {
		return this._listenerDemux.getConsumerCount(eventName);
	};

	killListener(eventName: string): void {
		this._listenerDemux.kill(eventName);
	};

	killAllListeners(): void {
		this._listenerDemux.killAll();
	};

	killListenerConsumer(consumerId: number): void {
		this._listenerDemux.kill(consumerId);
	};

	getListenerBackpressure(eventName?: string): number;
	getListenerBackpressure(consumerId: number): number;
	getListenerBackpressure(eventName?: string | number): number {
		return this._listenerDemux.getBackpressure(eventName as any);
	};

	hasListenerConsumer(consumerId: number): boolean;
	hasListenerConsumer(eventName: string, consumerId: number): boolean;
	hasListenerConsumer(eventName: string | number, consumerId?: number) {
		return this._listenerDemux.hasConsumer(eventName as any, consumerId!);
	};
}