import Enmap from "enmap";
/**
 * @typedef Redirect
 * @property {string} url
 * @property {boolean} [permanent=true]
 * @property {boolean} [allowRegex=false]
 */

/**
 * @typedef RedirectWithKey
 * @property {string} key
 * @property {string} url
 * @property {boolean} [permanent=true]
 * @property {boolean} [allowRegex=false]
 */


const defaultRedirect = {
    permanent: true,
    allowRegex: false,
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
        if (typeof redirect.permanent !== 'undefined' && typeof redirect.permanent !== 'boolean') throw new Error('Redirect permanent must be a boolean.');
        if (typeof redirect.allowRegex !== 'undefined' && typeof redirect.allowRegex !== 'boolean') throw new Error('Redirect allowRegex must be a boolean.');
        try {
            new URL(redirect.url);
        } catch (e) {
            throw new Error('Redirect URL must be a valid URL.', { cause: e });
        }
    }

    /**
     * Transforms a redirect, filling in default values.
     * @param {Redirect} redirect - The redirect to transform.
     * @returns {Redirect}
     */
    transformRedirect(redirect = {}) {
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
        if (this.#map.has(key))
            return this.transformRedirect(this.#map.get(key));
        else return null;
    }

    /**
     * Gets a redirect from the manager, respecting the allowRegex property.
     * @param {string} key - The key to get the redirect from.
     * @returns {RedirectWithKey?}
     */
    find(key) {
        let redirect = this.get(key);
        if (redirect) return { ...redirect, key };
        for (const [k, v] of this.#map) {
            if (v.allowRegex && new RegExp(k).test(key)) {
                redirect = this.transformRedirect(v);
                key = k;
                break;
            }
        }
        if (!redirect) return null;
        return { ...redirect, key };
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
     * Checks if a redirect exists, respecting the allowRegex property.
     * @param {string} key - The key to check.
     * @returns {boolean}
     */
    exists(key) {
        if (this.has(key)) return true;
        if (this.#map.some((value, slug) => value.allowRegex && new RegExp(slug).test(key))) return true;
        return false;
    }

    /**
     * Deletes a redirect from the manager.
     * @param {string} key - The key to delete the redirect from.
     */
    delete(key) {
        this.#map.delete(key);
        this.#stats.delete(key);
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

    /**
     * Applies a regex redirect to a URL.
     * @param {string} r - The regex to apply.
     * @param {string} url - The URL to apply the redirect to.
     * @param {string} toRun - The string to run the regex on.
     * @returns {string} - The new URL.
     */
    applyRegex(r, url, toRun) {
        const regex = new RegExp(r);
        const match = regex.exec(toRun);
        let fin = url.replace(/\$([0-9]+)/g, (m, p1) => {
            return match[parseInt(p1)] || '';
        });
        new URL(fin);
        return fin;
    }
}


const sharedManager = new Manager();

export default sharedManager;