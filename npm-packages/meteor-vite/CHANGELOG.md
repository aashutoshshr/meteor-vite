# meteor-vite

## 1.10.3-beta.0

### Patch Changes

- 8d4ea571: Update to handle the new parameter format for Meteor V3 release candidate's package registration queue. Should addess the issue mentioned on the Meteor forums: https://forums.meteor.com/t/meteor-3-0-rc-0-is-out/61515/9

## 1.10.2

### Patch Changes

- 9a770a44: Use ViteDevServer's resolvedUrls as the default for the Meteor client HTTP module entrypoint

## 1.10.1

### Patch Changes

- 5f19a295: Use the configured Vite client entrypoint as the default entrypoint for Vite dependency optimization.

  - Fixes #128

## 1.10.0

### Minor Changes

- 60491ff6: Add support for externalizing imports for npm packages bundled with Meteor

  - Allows you to point Vite to the Meteor bundle for some or all imports of an npm package.
    In most cases, you don't need to use this feature, but if you're using Meteor packages that
    have peer npm-dependencies, you can avoid the dependency being included twice in your final
    production bundle by hinting to Vite that this npm dependency is provided by Meteor.

  ```ts
  import React from "react"; // This will import from your node_modules

  // If you have a Meteor package that depends on React, then React will already be
  // in your Meteor client bundle. So you can instruct Vite to not import from node_modules
  import React from "meteor:react"; // This will import from your Meteor bundle
  ```

  - Fixes #33

## 1.9.1

### Patch Changes

- 1980ff5e: Check for METEOR_LOCAL_DIR environment variable when preparing the default meteor-vite plugin config.

  - Fixes #116
  - Fixes https://github.com/Akryum/meteor-vite/issues/46

## 1.9.0

### Minor Changes

- 3101e1a: Add support for Meteor v3.0-beta.0

  - Fixes #81

### Patch Changes

- 40edd14: Fix internal type for Package.json `tempBuildDir` configuration option

## 1.8.0

### Minor Changes

- 394ad2e: Update configuration options

  - Move advanced vite-bundler settings in `package.json` under `meteor.vite`.
  - Add option to customize Rollup chunk filenames in plugin config.

## 1.7.3

### Patch Changes

- c365435: Increase chunk hash length to 12 to address Vite warnings for large projects

  - Fixes #77

## 1.7.2

### Patch Changes

- f35f6c6: Use shortened file hashes over .chunk suffix for Vite build output.

## 1.7.1

### Patch Changes

- e55afeb: Tag Vite chunks to prevent the Meteor compiler plugin from interfering with server module bundling.

## 1.7.0

### Minor Changes

- 12fb8c5: Use Vite plugin config to customize the intermediary directory for the Vite bundle before it's sent to Meteor

## 1.6.0

### Minor Changes

- 9bd104d: Add option to configure Meteor-Vite though a Vite plugin rather than as a top-level property in the Vite user config.

## 1.5.0

### Minor Changes

- dbc9be4: Use temporary file in `meteor-vite` npm package to feed Vite bundle into Meteor for production.

  - Run build cleanup before creating a new Vite bundle.
  - Default Meteor stub validator to warnOnly when running in production mode.
  - Add SolidJS example app

  Fixes #34
  Fixes Akryum/meteor-vite#33
  Fixes meteor/meteor#12594

  ***

## 1.4.1

### Patch Changes

- 01795bc: Store info file for Vite dev server background worker in .meteor/local to prevent the file from being accidentally committed into version control by package users.

## 1.4.0

### Minor Changes

- 1ce04c9: Keep Vite dev server running between Meteor restarts (Fixes #35)

## 1.3.2

### Patch Changes

- d883954: Read Isopack metadata from global Meteor package cache

  Fixes #26

## 1.3.1

### Patch Changes

- 835dbd5: Fix package re-exports being re-exported once more within the Meteor stub template

## 1.3.0

### Minor Changes

- 9bcd19f: - Update MeteorStubs plugin error handler to emit errors when a Meteor client entrypoint isn't specified
  - Wrap MeteorStubs plugin around plugin setup helper function to catch and format exceptions whenever possible

## 1.2.2

### Patch Changes

- 3367848: Update internal communication between the Vite server worker and Meteor.

  Add fallback method for clients waiting on Vite server configuration from Meteor.

  Allow Vite config files to be stored outside of the project's root directory through package.json configuration. Details should be added to the README.

## 1.2.1

### Patch Changes

- 9b26de5: Update parser to eagerly parse and export all available exports for a given Meteor package

## 1.2.0

### Minor Changes

- 00a3567: - Migrate Vite stub validation configuration from Meteor's `settings.json` to Vite config.
  - Update exception names for stub validation
  - Add an option to stub validation where you can toggle it on or off entirely.

## 1.1.1

### Patch Changes

- c22937e: Fix error handling for non-MeteorVite errors

## 1.1.0

### Minor Changes

- 662a820: - Fixed an issue where Meteor builds with lazy-loaded packages would only work if Meteor had been run at least once in development mode.
  - Fixed an issue where some lazy-loaded packages would cause the Vite dev server to become unresponsive
  - Updated Vite dev server loggers.
