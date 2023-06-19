import Koa from 'koa';
import { config, resolveStatic } from './helpers.js';
import { join, normalize } from 'node:path';
import router from './routers/main.js';
import bodyParser from 'koa-bodyparser';

const app = new Koa();

const port = config.port || 3000;

app
    .use(async (ctx, next) => {
        // Page checking
        ctx.isManagement = ctx.request.hostname === config.managementHost;
        if (!ctx.isManagement) {
            ctx.request.url = join('/_api/redirect', ctx.request.url);
        } else ctx.request.url = normalize(ctx.request.url);

        // Do not track header
        ctx.track = ctx.request.headers.dnt !== '1';

        // Check auth
        const cookie = ctx.cookies.get('auth') || null;
        ctx.auth = ctx.isManagement && cookie === config.hash;

        await next();
    })
    .use(bodyParser())
    .use(router.routes())
    .use(router.allowedMethods())
    .use(async (ctx, next) => {
        if (ctx.status === 404 && ctx.isManagement && !ctx.body) {
            const { data, mime } = await resolveStatic(ctx.request.url);
            if (data) {
                ctx.body = data;
                ctx.type = mime;
                ctx.status = 200;
            }
        }
        await next();
    })
    .listen(port);

console.log(`Server running on port ${port}`);
