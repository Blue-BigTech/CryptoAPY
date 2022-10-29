export const SECOND_IN_MILLI = 1000;
export const ONE_DAY_IN_SECONDS = 24 * 3600;
export const TIMEOUT = 10000;

export function getCurrentTimestamp() {
    return (new Date()).getTime();
}

export * from './convert';
export * from './state';