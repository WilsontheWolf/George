import Router from "@koa/router";
import { getConfig, hashPassword } from "../helpers.js";
import sharedManager from "../Manager.js";

const config = await getConfig()
const router = new Router();

router.get('/redirect/:slug*', async (ctx, next) => {
    const slug = ctx.params.slug || '_default';
    if (!sharedManager.exists(slug)) {
        ctx.status = 404;
        return;
    }
    const redirect = sharedManager.find(slug);
    if (!redirect) {
        ctx.status = 404;
        return;
    }
    else {
        let url = redirect.url;
        if (redirect.allowRegex) {
            url = sharedManager.applyRegex(redirect.key, redirect.url, ctx.params.slug)
        }
        ctx.redirect(url);
        ctx.body = `<p>Redirecting to <a href="${url}">${url}</a>...</p>`;
        ctx.type = 'text/html';
        ctx.status = redirect.permanent ? 301 : 302;

        if (!ctx.isManagement) {
            sharedManager.hit(redirect.key);
        }
    }
});

router.get('/redirects', async (ctx, next) => {
    if (!ctx.auth) {
        ctx.status = 401;
        return;
    }

    ctx.body = sharedManager.redirects();
    ctx.type = 'application/json';
});

router.post('/redirects', async (ctx, next) => {
    if (!ctx.auth) {
        ctx.status = 401;
        return;
    }

    const slug = ctx.request?.body?.slug;
    const url = ctx.request?.body?.url;
    const permanent = !!ctx.request?.body?.permanent;
    const allowRegex = !!ctx.request?.body?.allowRegex;

    if (!slug || !url) {
        ctx.status = 400;
        return;
    }

    try {
        sharedManager.add(slug, { url, permanent, allowRegex });
    }
    catch (e) {
        ctx.status = 400;
        ctx.body = e.message;
        return;
    }

    ctx.status = 200;
});

router.patch('/redirects', async (ctx, next) => {
    if (!ctx.auth) {
        ctx.status = 401;
        return;
    }

    const slug = ctx.request?.body?.slug;
    const url = ctx.request?.body?.url;
    const permanent = !!ctx.request?.body?.permanent;
    const allowRegex = !!ctx.request?.body?.allowRegex;

    if (!slug) {
        ctx.status = 400;
        return;
    }

    if (!sharedManager.has(slug)) {
        ctx.status = 404;
        return;
    }

    try {
        sharedManager.update(slug, { url, permanent, allowRegex });
    }
    catch (e) {
        ctx.status = 400;
        ctx.body = e.message;
        return;
    }

    ctx.status = 200;
});

router.delete('/redirects', async (ctx, next) => {
    if (!ctx.auth) {
        ctx.status = 401;
        return;
    }

    const slug = ctx.request?.body?.slug;

    if (!slug) {
        ctx.status = 400;
        return;
    }

    if (!sharedManager.has(slug)) {
        ctx.status = 404;
        return;
    }

    sharedManager.delete(slug);

    ctx.status = 200;
});

router.get('/stats', async (ctx, next) => {
    if (!ctx.auth) {
        ctx.status = 401;
        return;
    }

    ctx.body = sharedManager.stats();
    ctx.type = 'application/json';
});

const hash = config.hash = config.secret ? hashPassword(config.secret) : null;

delete config.secret;
delete process.env.SECRET;

router.post('/login', async (ctx, next) => {
    const pass = ctx.request?.body?.password;
    if (!pass || !hash) {
        ctx.redirect('/');
        ctx.cookies.set('auth', null);
        return;
    }
    const passHash = hashPassword(pass);
    if (passHash !== hash) {
        ctx.redirect('/');
        ctx.cookies.set('auth', null);
        return;
    }

    ctx.cookies.set('auth', passHash, { httpOnly: true });

    ctx.redirect('/dash');
});

router.all('/logout', async (ctx, next) => {
    ctx.cookies.set('auth', '', { httpOnly: true });
    ctx.redirect('/');
});

export default router;