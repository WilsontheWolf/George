import Router from "@koa/router";
import { getConfig } from "../helpers.js";
import sharedManager from "../Manager.js";

const config = await getConfig()
const router = new Router();

router.get('/redirect/:slug*', async (ctx, next) => {
    const slug = ctx.params.slug || '_default';
    if (!sharedManager.has(slug)) {
        ctx.status = 404;
        return;
    }
    const redirect = sharedManager.get(slug);
    if (!redirect) {
        ctx.status = 404;
        return;
    }
    else {
        ctx.redirect(redirect.url);
        ctx.body = `<p>Redirecting to <a href="${redirect.url}">${redirect.url}</a>...</p>`;
        ctx.type = 'text/html';
        ctx.status = redirect.permanent ? 301 : 302;

        if(!ctx.isManagement) {
            sharedManager.hit(slug);
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

    if (!slug || !url) {
        ctx.status = 400;
        return;
    }

    try {
        sharedManager.add(slug, { url, permanent });
    }
    catch (e) {
        ctx.status = 400;
        ctx.body = e.message;
        return;
    }

    ctx.status = 200;
});

router.patch('/redirects/:slug', async (ctx, next) => {
    if (!ctx.auth) {
        ctx.status = 401;
        return;
    }

    const slug = ctx.params.slug;
    const url = ctx.request?.body?.url;
    const permanent = !!ctx.request?.body?.permanent;

    if (!slug) {
        ctx.status = 400;
        return;
    }

    if (!sharedManager.has(slug)) {
        ctx.status = 404;
        return;
    }

    try {
        sharedManager.update(slug, { url, permanent });
    }
    catch (e) {
        ctx.status = 400;
        ctx.body = e.message;
        return;
    }

    ctx.status = 200;
});

router.delete('/redirects/:slug', async (ctx, next) => {
    if (!ctx.auth) {
        ctx.status = 401;
        return;
    }

    const slug = ctx.params.slug;

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


router.post('/login', async (ctx, next) => {
    const pass = ctx.request?.body?.password;
    if (!pass || !config.secret) {
        ctx.redirect('/');
        return;
    }
    if (pass !== config.secret) {
        ctx.redirect('/');
        return;
    }

    ctx.cookies.set('auth', config.secret, { httpOnly: true });

    ctx.redirect('/dash');
});

router.all('/logout', async (ctx, next) => {
    ctx.cookies.set('auth', '', { httpOnly: true });
    ctx.redirect('/');
});

export default router;