# vite-bundler

## 1.12.13

### Patch Changes

- 8fefb051: Update version compatability to prevent installs from Meteor v3 when they should use the 2.0 release. The API is the same, just the underlying bundle strategy that is incompatible.

## 1.12.12

### Patch Changes

- 11cd39ec: Fix base URL for Meteor IPC listener

## 1.12.11

### Patch Changes

- 58d9d7d6: Fix destination URI for Vite worker IPC messages
- 93af413a: Handle new Meteor v3 promise return type for Assets utility

## 1.12.10

### Patch Changes

- 9a770a44: Use ViteDevServer's resolvedUrls as the default for the Meteor client HTTP module entrypoint

## 1.12.9

### Patch Changes

- b6871542: Keep npm import references when analyzing Meteor client dependencies

## 1.12.8

### Patch Changes

- 1980ff5e: Check for METEOR_LOCAL_DIR environment variable when preparing the default meteor-vite plugin config.

  - Fixes #116
  - Fixes https://github.com/Akryum/meteor-vite/issues/46

## 1.12.7

### Patch Changes

- 8c3835e6: Add option to disable post-build cleanup
- 45d8c1d9: Fix import path resolver for the Vite client bundle entry file. Addresses an incorrect import string with client mainModules outside of the Meteor client root directory.
- 4b247310: Use original file path for JavaScript added through the compiler plugin
- 869c6912: Directly import Vite bundle instead of using a proxy module for importing the bundle. This works around an issue in Meteor v3 where proxy modules wouldn't hit Meteor's build plugin system.
- 5b9984fe: Use bundle file extension for entry module
- f84332b3: Include bundle file extension in entry module import string
- 9a16a31a: Yield a promise for a compiler plugin in Meteor v3 environments

## 1.12.6

### Patch Changes

- 8bb3b7b8: Move Vite client bundle entry file into client directory instead of relying on augmenting the meteor-vite package
  contents. This addresses some spotty behaviour where the client bundle would occasionally not load in certain
  environments, like projects managed through npm workspaces.

## 1.12.5

### Patch Changes

- 4bd1edcc: Fix inconsistent Vite client entry asset file path and remove unused imports from build module

## 1.12.4

### Patch Changes

- c460b9b: Publish package using Meteor v2

  - Fixes #101

## 1.12.3

### Patch Changes

- af8c83a: Publish package using Meteor v3.0-beta.0

## 1.12.2

### Patch Changes

- 61a8c8a: Add Meteor V3 beta build version constraints to package.js

## 1.12.1

### Patch Changes

- 9eae8fd: Refactor build plugin entrypoint to use TypeScript

## 1.12.0

### Minor Changes

- 84fe921: Add minimal support for Meteor v3 (#83)

  - Refactor internal Vite dev server config store to use async collection methods rather than relying on Fibers.
  - Increased minimum Meteor version requirement to v2.8.2
  - Add previously missing `mongo` dependency to `package.js` dependencies.

  Todo:

  - [ ] Update Meteor bundle parser to handle new bundle format from v3. (#81)

## 1.11.0

### Minor Changes

- 394ad2e: Update configuration options

  - Move advanced vite-bundler settings in `package.json` under `meteor.vite`.
  - Add option to customize Rollup chunk filenames in plugin config.

## 1.10.1

### Patch Changes

- 86acfbe: Re-add version requirements for build plugin

## 1.10.0

### Minor Changes

- c168454: Use looser dependency version requirements.

  - Use standard package versions from Meteor [`v1.8`](https://docs.meteor.com/changelog#v18320191219),
    [`v2.3`](https://docs.meteor.com/changelog#v2320210624) and [`v2.12`](https://docs.meteor.com/changelog#v212020230428)
  - Make [`zodern:types`](https://github.com/zodern/meteor-types) a weak dependency
  - Revert use of modern number syntax (#73 #74)

## 1.9.1

### Patch Changes

- bcffa94: Handle different import string formats when checking for existing meteor-vite import in meteor entry.

## 1.9.0

### Minor Changes

- 12fb8c5: Use Vite plugin config to customize the intermediary directory for the Vite bundle before it's sent to Meteor

## 1.8.1

### Patch Changes

- ccd17f6: Create release on GitHub

## 1.8.0

### Minor Changes

- 9bd104d: Add option to configure Meteor-Vite though a Vite plugin rather than as a top-level property in the Vite user config.

## 1.7.3

### Patch Changes

- 2921838: Use shared import path formatter for meteor-vite bundle importer and project reference import.

## 1.7.2

### Patch Changes

- 917a547: Correct import path serialization for meteor-vite entryfile on Windows

## 1.7.1

### Patch Changes

- 7c56b11: Fix mainModule validation running before `VITE_METEOR_DISABLED` environment checks

  - Refactor file paths and internal notes for Vite bundle entry module.
  - Handle empty parent directory for final Vite bundle's entry module.

## 1.7.0

### Minor Changes

- dbc9be4: Use temporary file in `meteor-vite` npm package to feed Vite bundle into Meteor for production.

  - Run build cleanup before creating a new Vite bundle.
  - Default Meteor stub validator to warnOnly when running in production mode.
  - Add SolidJS example app

  Fixes #34
  Fixes Akryum/meteor-vite#33
  Fixes meteor/meteor#12594

  ***

## 1.6.1

### Patch Changes

- 56394e8: Add default server flag to temporary Meteor build

## 1.6.0

### Minor Changes

- 43826f1: Add option for users to pass through environment variables to the Vite dev server worker. Useful if for enabling the Vite debug logs or changing the Node environment.

  Variable prefix `METEOR_VITE_WORKER_`.
  `METEOR_VITE_WORKER_DEBUG="vite:_"` gets translated into `DEBUG="vite:_"`

## 1.5.1

### Patch Changes

- ece1579: Emit warning message if an outdated version of the meteor-vite npm package is in use.

## 1.5.0

### Minor Changes

- 1ce04c9: Keep Vite dev server running between Meteor restarts (Fixes #35)

## 1.4.1

### Patch Changes

- a20a85a: Fix documentation reference in package.js

## 1.4.0

### Minor Changes

- a95e216: - Load Vite entrypoint module dynamically while waiting for the server to start up.
  - Import Vite client bundle in addition to the Vite entrypoint. This should allow for a nice error message to be displayed in the browser when the Vite entrypoint module cannot be loaded.
  - Updated the Vite dev server startup splash screen to include console logs.

## 1.2.3

### Patch Changes

- 74d9bab: Refresh page if the Vite dev server entrypoint fails to load in the browser

## 1.2.2

### Patch Changes

- d883954: Read Isopack metadata from global Meteor package cache

  Fixes #26

## 1.2.1

### Patch Changes

- 0c29f67: Hotfix: Vite-Bundler builds being skipped due to invalid environment variable check

## 1.2.0

### Minor Changes

- c5467ef: Transmit Meteor's IPC messages through to Vite worker process, enabling Meteor-Vite to gracefully import lazy-loaded packages for the client without throwing errors.

## 1.1.3

### Patch Changes

- 661d17d: Fix issue where production builds would fail for projects without a tsconfig.json file

## 1.1.2

### Patch Changes

- 3367848: Update internal communication between the Vite server worker and Meteor.

  Add fallback method for clients waiting on Vite server configuration from Meteor.

  Allow Vite config files to be stored outside of the project's root directory through package.json configuration. Details should be added to the README.

## 1.1.1

### Patch Changes

- 3c553e2: - Rework "waiting for Vite" splash screen to work around issue where the screen would need to be refreshed manually.
  - Add `zodern:types` to vite-bundler

## 1.1.0

### Minor Changes

- 662a820: - Fixed an issue where Meteor builds with lazy-loaded packages would only work if Meteor had been run at least once in development mode.
  - Fixed an issue where some lazy-loaded packages would cause the Vite dev server to become unresponsive
  - Updated Vite dev server loggers.

## 1.0.1

### Patch Changes

- ad22a24: - Clean up internal tsconfig.json
  - Test changeset releases
