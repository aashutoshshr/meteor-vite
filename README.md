# meteor-vite

Use [Vite](https://vitejs.dev) in your Meteor app! ⚡️

## Key features
> ⚡**Significantly speeds up Meteor's client-side build process. Uses the Vite dev server under-the-hood, leading to blazing fast hot-module-replacement during development.**

- Minimal migration steps for existing Meteor projects
- Handles lazy-loaded Meteor packages & automatic code splitting for dynamic imports
- Modernizes your client bundle's build process, giving you more flexibility by tapping into the Vite plugin ecosystem.
- Simplifies a lot of the setup for things like CSS preprocessors and UI frameworks

## Starter templates
  - [**Vue 3**](https://vuejs.org/)
    - [Example Project](/examples/vue) 
    - [Preview](https://vue--meteor-vite.wcaserver.com) 
  - [**Svelte**](https://svelte.dev/)
    - [Example Project](/examples/svelte)
    - [Preview](https://svelte--meteor-vite.wcaserver.com)
  - [**React**](https://react.dev/)
    - [Example Project](/examples/react)
    - [Preview](https://react--meteor-vite.wcaserver.com)
  - [**Solid.js**](https://www.solidjs.com/)
    - [Example Project](/examples/solid)
    - [Preview](https://solid--meteor-vite.wcaserver.com)
  - Meteor v3 (Work in progress)
    - [Example Project](/examples/meteor-v3-vue)
    - [Preview](https://meteor-v3-vue--meteor-vite.wcaserver.com)


## Installation

```sh
# Install meteor-vite and Vite v4
meteor npm i -D vite@4 meteor-vite

# Then add the Vite-Bundler package to your Meteor project. 
meteor add jorgenvatle:vite-bundler
```

You can also install any vite plugin, for example `@vitejs/plugin-vue`:

```sh
meteor npm i -D @vitejs/plugin-vue
```

Make sure to have an import client entry (`meteor.mainModule.client`) in your `package.json`:

```json5
{
  "name": "my-app",
  "private": true,
  "scripts": {
    "dev": "meteor run",
    "build": "meteor build ../output/vue --directory"
  },
  "dependencies": {
    // ...
  },
  "meteor": {
    "mainModule": {
      "client": "imports/entrypoint/meteor.ts",
      "server": "server/main.ts"
    },
  }
}
```

You can leave your Meteor client entry file empty, but it's necessary to enable Meteor import mode. In the example
above, we can create an empty `imports/entrypoint/meteor.ts` file.

Create a Vite configuration file (`vite.config.js`) in your project root.
As we don't use a standard Vite `index.html` file, we need to specify an entry point (different from the Meteor one):

#### Example with Vue
```js
// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { meteor } from 'meteor-vite/plugin';

export default defineConfig({
    plugins: [
        meteor({
          clientEntry: 'imports/entrypoint/vite.ts',
        }),
        vue(),
    ],
    // Other vite options here...
})
```

You can then write your code from the `vite.ts` entry point and it will be handled by Vite! ⚡️

## Configuration

### Vite Config
```ts
// vite.config.ts
import { meteor } from 'meteor-vite/plugin';

export default defineConfig({
    plugins: [
        meteor({
          /**
           * Path to the client entrypoint for your app.
           * This becomes your new Vite-powered mainModule for Meteor.
           */
          clientEntry: 'imports/entrypoint/vite.ts',

          /**
           * Configures runtime validation of Meteor package stubs generated by Vite. 
           * See Features section in readme for more info
           * (optional)
           */
          stubValidation: {
            /**
             * list of packages to ignore export validation for.
             */
            ignorePackages: ["ostrio:cookies"],

            /**
             * Will only emit warnings in the console instead of throwing an exception that may prevent the client app
             * from loading.
             */
            warnOnly: true,

            /**
             * Set to true to completely disable stub validation. Any of the above options will be ignored.
             * This is discuraged as `warnOnly` should give you an important heads up if something might be wrong with Meteor-Vite
             */
            disabled: false,
          }
        })
    ],
})
```

### Meteor plugin settings
There are a couple extra advanced settings you can change through your `package.json` file under `meteor.vite`.
In most cases, you won't need to add anything here.
```json5
// package.json
{
  "name": "my-app"
  // ...
  
  "meteor": {
    "mainModule": { /* ... */ },
    
    // Additional configuration for Meteor-Vite (optional)
    "vite": {
      // If your Vite config file lives in another directory (e.g. private/vite.config.ts), specify its path here
      "configFile": "",
      
      // Replace or remove Meteor packages when bundling Vite for production.
      // This may be useful for a small subset of compiler-plugin packages that interfere with Vite's build process.
      //
      // This is only used during the Vite bundling step. The packages included in your final production 
      // bundle remains unaffected.
      "replacePackages": [
        // Removes standard-minifier packages while building with Vite. (default)
        { "startsWith": "standard-minifier", "replaceWith": "" },

        // Replace refapp:meteor-typescript with the official typescript package. (default)
        { "startsWith": "refapp:meteor-typescript", replaceWith: "typescript" },
      ]
    }
  }
}
```

## Features in-depth

### Lazy Loaded Meteor Packages
Meteor-Vite will automatically detect lazy loaded Meteor packages and import them into your Meteor client's entrypoint.
This is necessary to ensure that the Vite bundler has access to your Meteor packages.

The imported files can safely be committed to your project repository. If you remove the associated package in the
future, simply remove the import statement.

Our detection for these packages is fairly primitive, so it's best to keep the imports in the Meteor client
entrypoint as specified in the `meteor.mainModule.client` field of your `package.json` file.
```json5
{
  "meteor": {
    "mainModule": {
      "client": "imports/entrypoint/meteor.ts", // Lazy loaded packages checked for and added to this file.
      "server": "server/main.ts"
    }
  }
}
```

### Stub validation
Runtime validation at the client is performed for Meteor packages that are compiled by Vite. This is done to avoid a
situation where Meteor-Vite incorrectly exports undefined values from a Meteor Package. Which can lead to silently
broken Meteor packages.

The validation is done simply through verifying that package exports do not have a `typeof` value of `undefined`.
If you do have a package that intentionally has `undefined` exports, you can disable the warning message for this
package by excluding it in your Meteor settings.json file;
```ts
// vite.config.ts
export default defineConfig({
  plugins: [
      meteor({
        stubValidation: {
            ignorePackages: ["ostrio:cookies"]
        }
      })
  ]
})
```

## A note about the Meteor `mainModule`
Code written to or imported by your Meteor client's [`mainModule.client`](https://docs.meteor.com/packages/modules.html#Modular-application-structure) 
will not be processed by Vite, however, it will still by loaded by the Meteor client. So if you have a use case where 
you have some code that you don't want Vite to process, but still want in your client bundle, this would be the place 
to put that.

But do be careful with this - any code that's imported by both your Vite config's [`clientEntry`](#example-with-vue)
and your Meteor `mainModule.client` may lead to the code being included twice in your final production bundle.

## Package Details
The Vite integration comes with two dependencies that work together to enable compatibility between Meteor and Vite.

- [`meteor-vite`](/npm-packages/meteor-vite/) - Internal Vite plugin and server worker parsing and formatting Meteor packages for Vite.
    - [View changelog](/npm-packages/meteor-vite/CHANGELOG.md)
    - [View on npm](https://www.npmjs.com/package/meteor-vite)

- [`jorgenvatle:vite-bundler`](/packages/vite-bundler/) - Meteor build plugin for launching Vite workers and compiling production bundles from Vite and Meteor.
    - [View changelog](/packages/vite-bundler/CHANGELOG.md)
    - [View on Atmosphere](https://atmospherejs.com/jorgenvatle/vite-bundler)


## Roadmap
- [x] Development mode
- [x] Build
- [x] Importing non-core Meteor packages
- [x] Lazy meteor packages
- [x] Reify support
    - [x] Named exports
    - [x] Default exports
    - [x] Re-exports (named + wildcard)
    - [x] Re-exports via intermediary variable
- [ ] Meteor v3 Support
    - [x] Migrate bundler from Fibers to Async/Await
    - [ ] Update Meteor bundle parser to support new format introduced in v3.
- [x] Code-splitting/Dynamic imports
- [ ] Migrate intermediary production-build transpile step from Babel to esbuild.
- [ ] SSR (not tested)
- [ ] Starter/demo templates
    - [x] [Vue 3](/examples/vue)
        - [Live demo](https://vue--meteor-vite.wcaserver.com/)
    - [x] [Svelte](/examples/svelte)
        - [Live demo](https://svelte--meteor-vite.wcaserver.com/)
    - [x] [React](/examples/react)
        - [Live demo](https://react--meteor-vite.wcaserver.com/)
    - [x] [SolidJS](/examples/solid)
        - [Live demo](https://solid--meteor-vite.wcaserver.com/)
    - [ ] [Meteor v3 + Vue](/examples/meteor-v3-vue) (Isopack compatability still pending)
        - [Live demo](https://meteor-v3-vue--meteor-vite.wcaserver.com/)
