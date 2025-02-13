import { Elysia } from 'elysia'
import { staticPlugin } from '@elysiajs/static'

console.log('Listen :3000...');
new Elysia()
  .use(staticPlugin({
    prefix: '/',
  }))
  .listen(3000)