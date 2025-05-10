export declare function omitBy<T>(object: Record<string, T>, predicate: (value: T, key: string) => boolean): Record<string, T>;
export declare function pickBy<T>(object: Record<string, T>, predicate: (value: T, key: string) => boolean): Record<string, T>;
export declare function cloneDeep<T>(object: T): T;
