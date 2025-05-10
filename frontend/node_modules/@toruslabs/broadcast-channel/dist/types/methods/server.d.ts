export function storageKey(channelName: any): string;
/**
 * writes the new message to the storage
 * and fires the storage-event so other readers can find it
 */
export function postMessage(channelState: any, messageJson: any): Promise<any>;
export function getSocketInstance(serverUrl: any): any;
export function setupSocketConnection(serverUrl: any, channelState: any, fn: any): any;
export function removeStorageEventListener(): void;
export function create(channelName: any, options: any): {
    channelName: any;
    uuid: string;
    eMIs: ObliviousSet<any>;
    serverUrl: any;
    time: number;
};
export function close(channelState: any): void;
export function onMessage(channelState: any, fn: any, time: any): void;
export function canBeUsed(): boolean;
export function averageResponseTime(): number;
export const microSeconds: typeof micro;
export const type: "server";
declare namespace _default {
    export { create };
    export { close };
    export { onMessage };
    export { postMessage };
    export { canBeUsed };
    export { type };
    export { averageResponseTime };
    export { microSeconds };
}
export default _default;
import { ObliviousSet } from 'oblivious-set';
import { microSeconds as micro } from '../util';
