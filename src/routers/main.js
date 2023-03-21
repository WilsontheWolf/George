import Router from "@koa/router";
import apiRouter from './api.js';

const router = new Router();

router.all('/dash(.*)', async (ctx, next) => {
    if(!ctx.auth) {
        ctx.redirect('/');
        return;
    }
    await next();
});

router.get('/', async (ctx, next) => {
    if(ctx.auth) {
        ctx.redirect('/dash');
        return;
    }
    await next();
});

router.use('/_api', apiRouter.routes(), apiRouter.allowedMethods());

export default router;