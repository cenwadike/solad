/**
 * copied from crosstab
 * @link https://github.com/tejacques/crosstab/blob/master/src/crosstab.js#L32
 */
export function getLocalStorage(): any;
export function storageKey(channelName: any): string;
/**
 * writes the new message to the storage
 * and fires the storage-event so other readers can find it
 */
export function postMessage(channelState: any, messageJson: any): Promise<any>;
export function addStorageEventListener(channelName: any, fn: any): (ev: any) => void;
export function removeStorageEventListener(listener: any): void;
export function create(channelName: any, options: any): {
    channelName: any;
    uuid: string;
    time: number;
    eMIs: ObliviousSet<any>;
};
export function close(channelState: any): void;
export function onMessage(channelState: any, fn: any, time: any): void;
export function canBeUsed(): boolean;
export function averageResponseTime(): number;
export const microSeconds: typeof micro;
export const type: "localstorage";
declare namespace _default {
    export { getLocalStorage };
    export { create };
    export { close };
    export { onMessage };
    export { postMessage };
    export { canBeUsed };
    export { type };
    export { averageResponseTime };
    export { microSeconds };
    export { storageKey };
    export { addStorageEventListener };
    export { removeStorageEventListener };
}
export default _default;
import { ObliviousSet } from 'oblivious-set';
import { microSeconds as micro } from '../util';
