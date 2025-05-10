export function getIdb(): any;
/**
 * If possible, we should explicitly commit IndexedDB transactions
 * for better performance.
 * @link https://nolanlawson.com/2021/08/22/speeding-up-indexeddb-reads-and-writes/
 */
export function commitIndexedDBTransaction(tx: any): void;
export function createDatabase(channelName: any): Promise<any>;
/**
 * writes the new message to the database
 * so other readers can find it
 */
export function writeMessage(db: any, readerUuid: any, messageJson: any): Promise<any>;
export function getAllMessages(db: any): Promise<any>;
export function getMessagesHigherThan(db: any, lastCursorId: any): Promise<any>;
export function removeMessagesById(db: any, ids: any): Promise<any[]>;
export function getOldMessages(db: any, ttl: any): Promise<any>;
export function cleanOldMessages(db: any, ttl: any): Promise<any[]>;
export function create(channelName: any, options: any): Promise<{
    closed: boolean;
    lastCursorId: number;
    channelName: any;
    options: any;
    uuid: string;
    /**
     * emittedMessagesIds
     * contains all messages that have been emitted before
     * @type {ObliviousSet}
     */
    eMIs: ObliviousSet;
    writeBlockPromise: Promise<void>;
    messagesCallback: any;
    readQueuePromises: any[];
    db: any;
    time: number;
}>;
export function close(channelState: any): void;
export function postMessage(channelState: any, messageJson: any): any;
export function onMessage(channelState: any, fn: any, time: any): void;
export function canBeUsed(): boolean;
export function averageResponseTime(options: any): number;
export const microSeconds: typeof micro;
export namespace TRANSACTION_SETTINGS {
    let durability: string;
}
export const type: "idb";
declare namespace _default {
    export { getIdb };
    export { createDatabase };
    export { create };
    export { close };
    export { onMessage };
    export { postMessage };
    export { canBeUsed };
    export { type };
    export { averageResponseTime };
    export { microSeconds };
    export { writeMessage };
    export { getAllMessages };
    export { cleanOldMessages };
    export { getMessagesHigherThan };
    export { getOldMessages };
}
export default _default;
import { ObliviousSet } from 'oblivious-set';
import { microSeconds as micro } from '../util.js';
