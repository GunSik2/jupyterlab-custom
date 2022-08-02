/**
 * Call the API extension
 *
 * @param endPoint API REST end point for the extension
 * @param init Initial values for the request
 * @returns The response body interpreted as JSON
 */
export declare function requestAPI<T>(endPoint?: string, init?: RequestInit): Promise<T>;
export declare const moonsOfJupyter: string[];
/**
 * Get a random user-name based on the moons of Jupyter.
 * This function returns names like "Anonymous Io" or "Anonymous Metis".
 */
export declare const getAnonymousUserName: () => string;
