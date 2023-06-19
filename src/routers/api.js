import Router from "@koa/router";
import { config, hashPassword } from "../helpers.js";
import sharedManager from "../Manager.js";

const router = new Router();

router.use(async (ctx, next) => {
    ctx.type = 'application/json';
    await next();
});

router.get('/redirect/:slug*', async (ctx, next) => {
    const slug = ctx.params.slug || '_default';
    ctx.type = 'text/html';
    if (!sharedManager.exists(slug)) {
        ctx.status = 404;
        ctx.body = "<p>I'm sorry, but that page couldn't be found.</p>"
        return;
    }
    const redirect = sharedManager.find(slug);
    if (!redirect) {
        ctx.status = 404;
        ctx.body = "<p>I'm sorry, but that page couldn't be found.</p>"
        return;
    }
    else {
        let url = redirect.url;
        if (redirect.allowRegex) {
            url = sharedManager.applyRegex(redirect.key, redirect.url, ctx.params.slug)
        }
        ctx.redirect(url);
        ctx.body = `<p>Redirecting to <a href="${url}">${url}</a>...</p>`;
        ctx.status = redirect.permanent ? 301 : 302;

        if (!ctx.isManagement) {
            sharedManager.hit(redirect.key);
        }
    }
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

router.use(async (ctx, next) => {
    if(!ctx.auth) {
        ctx.status = 401;
        ctx.body = { ok: false, msg: 'Not authorized' };
        return;
    }
    await next();
});

router.get('/redirects', async (ctx, next) => {

    ctx.body = { ok: true, data: sharedManager.redirects() };
});

router.post('/redirects', async (ctx, next) => {

    const slug = ctx.request?.body?.slug;
    const url = ctx.request?.body?.url;
    const permanent = !!ctx.request?.body?.permanent;
    const allowRegex = !!ctx.request?.body?.allowRegex;

    if (!slug || !url) {
        ctx.status = 400;
        ctx.body = { ok: false, msg: 'Slug and URL are required' };
        return;
    }

    try {
        sharedManager.add(slug, { url, permanent, allowRegex });
        ctx.body = { ok: true };
    }
    catch (e) {
        ctx.status = 400;
        ctx.body = { ok: false, msg: e.message };
        return;
    }

    ctx.status = 200;
});

router.patch('/redirects', async (ctx, next) => {

    const slug = ctx.request?.body?.slug;
    const url = ctx.request?.body?.url;
    const permanent = !!ctx.request?.body?.permanent;
    const allowRegex = !!ctx.request?.body?.allowRegex;

    if (!slug) {
        ctx.status = 400;
        ctx.body = { ok: false, msg: 'Slug is required' };
        return;
    }

    if (!sharedManager.has(slug)) {
        ctx.status = 404;
        ctx.body = { ok: false, msg: 'Slug not found' };
        return;
    }

    try {
        sharedManager.update(slug, { url, permanent, allowRegex });
        ctx.body = { ok: true };
    }
    catch (e) {
        ctx.status = 400;
        ctx.body = { ok: false, msg: e.message };
        return;
    }

    ctx.status = 200;
});

router.delete('/redirects', async (ctx, next) => {

    const slug = ctx.request?.body?.slug;

    if (!slug) {
        ctx.status = 400;
        ctx.body = { ok: false, msg: 'Slug is required' };
        return;
    }

    if (!sharedManager.has(slug)) {
        ctx.status = 404;
        ctx.body = { ok: false, msg: 'Slug not found' };
        return;
    }

    sharedManager.delete(slug);
    ctx.body = { ok: true };

    ctx.status = 200;
});

router.get('/stats', async (ctx, next) => {
    if (!ctx.auth) {
        ctx.status = 401;
        ctx.body = { ok: false, msg: 'Not authorized' };
        return;
    }

    ctx.body = { ok: true, data: sharedManager.stats() };
});

export default router;