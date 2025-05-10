/**
 * returns true if the given object is a promise
 */
export function isPromise(obj: any): boolean;
export function sleep(time: any, resolveWith: any): Promise<any>;
export function randomInt(min: any, max: any): number;
/**
 * https://stackoverflow.com/a/8084248
 */
export function randomToken(): string;
/**
 * returns the current time in micro-seconds,
 * WARNING: This is a pseudo-function
 * Performance.now is not reliable in webworkers, so we just make sure to never return the same time.
 * This is enough in browsers, and this function will not be used in nodejs.
 * The main reason for this hack is to ensure that BroadcastChannel behaves equal to production when it is used in fast-running unit tests.
 */
export function microSeconds(): number;
export const PROMISE_RESOLVED_FALSE: Promise<boolean>;
export const PROMISE_RESOLVED_TRUE: Promise<boolean>;
export const PROMISE_RESOLVED_VOID: Promise<void>;
export const log: loglevel.Logger;
export function setLogLevel(level: any): void;
import loglevel from 'loglevel';
