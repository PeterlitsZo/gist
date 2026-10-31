import { $, serve } from 'bun';

await $`rm -rf the_dom/public && mkdir the_dom/public`;

await $`cd the_lib && bun run build`;
await $`mv the_lib/dist/* the_dom/public/`;

const document = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite + TS</title>

    <link href="/my-lib.css" rel="stylesheet"></style>
  </head>
  <body>
    <div id="app"></div>

    <script src="/my-lib.umd.cjs"></script>
    <script defer>
      MyLib.renderApp('app')
    </script>
  </body>
</html>
`;
await $`printf "%s" ${document} > ./the_dom/public/index.html`;

await $`cd the_dom && bun run index.ts`;