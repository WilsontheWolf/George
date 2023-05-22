import Mime from 'mime';
import { createHmac } from 'node:crypto';
import fs from 'node:fs/promises';
import { basename, dirname, extname, join, resolve } from 'node:path';

const defaultConfig = {
    managementHost: 'localhost',
    secret: process.env.SECRET,
    port: process.env.PORT || 3000,
};

let configCache;

const getConfig = async () => {
    if (configCache) return configCache;
    const config = await fs.readFile('./data/config.json', 'utf-8')
        .then(JSON.parse)
        .catch((e) => {
            console.warn('No config file found. Using default config.', e);
            return {};
        });
    configCache = { ...defaultConfig, ...config }
    return configCache;
}

const staticCache = new Map();
const fileCache = new Map();

const tryFile = async (file, origPath) => {
    if (typeof file === 'string') file = [file];
    for (const f of file) {
        if (fileCache.has(f) && process.env.NODE_ENV !== 'development') return fileCache.get(f);

        const data = await fs.readFile(f).catch(e => null);
        const mime = data ? Mime.getType(f) || 'text/html' : null;
        fileCache.set(f, { data, mime });
        if (!data) continue;
        staticCache.set(origPath, f);
        return { data, mime };
    }
    staticCache.set(origPath, null);
    return { data: null, mime: null };
}

const resolveStatic = async (file) => {
    if (staticCache.has(file) && process.env.NODE_ENV !== 'development') return fileCache.get(staticCache.get(file)) || {};
    let name = basename(file);
    const path = join('src/public', resolve(dirname(file)));
    const ext = extname(name);

    let resolved;
    if (ext) {
        resolved = join(path, name);
    }
    else {
        if (!name) {
            resolved = join(path, 'index.html');
        }
        else {
            resolved = [
                join(path, name + '.html'),
                join(path, name),
                join(path, name, 'index.html'),
            ]
        }
    }

    return tryFile(resolved, file);
}

const hashPassword = (pass) => {
    const hmac = createHmac('sha256', pass);

    return hmac.digest('hex');
}

export { getConfig, resolveStatic, hashPassword };