import Enmap from "enmap";
/**
 * @typedef Redirect
 * @property {string} url
 * @property {boolean} [permanent=true]
 */


const defaultRedirect = {
    permanent: true
};

class Manager {
    /** @type{Enmap<string, Redirect>} */
    #map = new Enmap('redirects');
    #stats = new Enmap('stats');
    constructor() {

    }

    /**
     * Validates a redirect.
     * @param {Redirect} redirect - The redirect to validate.
     * @throws {Error} - If the redirect is invalid.
     */
    validateRedirect(redirect) {
        if (!redirect || typeof redirect !== 'object') throw new Error('Redirect must be an object.');
        if (!redirect.url) throw new Error('Redirect must have a URL.');
        if (typeof redirect.url !== 'string') throw new Error('Redirect URL must be a string.');
        try {
            new URL(redirect.url);
        } catch (e) {
            throw new Error('Redirect URL must be a valid URL.', { cause: e });
        }
    }

    transformRedirect(redirect) {
        return {
            ...defaultRedirect,
            ...redirect
        };
    }

    /**
     * Adds a new redirect to the manager.
     * @param {string} key - The key to add the redirect to.
     * @param {Redirect} value - The redirect to add.
     * @throws {Error} - If the key already exists.
     * @throws {Error} - If the redirect is invalid.
     */
    add(key, value) {
        if (this.has(key)) throw new Error('Key already exists.');
        this.validateRedirect(value);
        this.#map.set(key, value);
    }

    /**
     * Updates a redirect in the manager.
     * @param {string} key - The key to update the redirect in.
     * @param {Redirect} value - The redirect to update.
     * @throws {Error} - If the key does not exist.
     * @throws {Error} - If the redirect is invalid.
     */
    update(key, value) {
        if (!this.has(key)) throw new Error('Key does not exist.');
        const old = this.get(key);
        value = { ...old, ...value }
        this.validateRedirect(value);
        this.#map.set(key, value);
    }


    /**
     * Gets a redirect from the manager.
     * @param {string} key - The key to get the redirect from.
     * @returns {Redirect?}
     */
    get(key) {
        return this.transformRedirect(this.#map.get(key));
    }

    /**
     * Checks if a key exists in the manager.
     * @param {string} key - The key to check.
     * @returns {boolean}
     */
    has(key) {
        return this.#map.has(key);
    }

    /**
     * Deletes a redirect from the manager.
     * @param {string} key - The key to delete the redirect from.
     * @returns {boolean}
     */
    delete(key) {
        return this.#map.delete(key);
    }

    /**
     * Gets all redirects from the manager.
     * @returns {Redirect[]}
     */
    redirects() {
        return [...this.#map.entries()].map(([key, value]) => ({
            key,
            ...this.transformRedirect(value)
        }));
    }

    /**
     * Adds a hit to the stats for a redirect.
     * @param {string} key - The key to add the hit to.
     * @returns {number} - The new hit count.
     * @throws {Error} - If the key does not exist.
     */
    hit(key) {
        if (!this.has(key)) throw new Error('Key does not exist.');
        const hits = this.#stats.ensure(key, 0);
        this.#stats.inc(key);
        return hits + 1;
    }

    /**
     * Gets the hit count for a redirect.
     * @param {string} key - The key to get the hit count for.
     * @returns {number} - The hit count.
     * @throws {Error} - If the key does not exist.
     */
    hits(key) {
        if (!this.has(key)) throw new Error('Key does not exist.');
        return this.#stats.ensure(key, 0);
    }

    /**
     * Gets all stats from the manager.
     * @returns {Object<string, number>}
     */
    stats() {
        const stats = {};
        for (const [key, value] of this.#stats) {
            stats[key] = value;
        }
        return stats;
    }
}


const sharedManager = new Manager();

export default sharedManager;