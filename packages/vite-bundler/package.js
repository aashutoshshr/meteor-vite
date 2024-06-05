Package.describe({
  name: 'jorgenvatle:vite-bundler',
  version: '1.12.12',
  summary: 'Integrate the Vite.js bundler with Meteor',
  git: 'https://github.com/JorgenVatle/meteor-vite',
  documentation: 'README.md',
})

Package.registerBuildPlugin({
    name: 'vite',
    use: [
        'ecmascript@0.16.2 || 1.0.0',
        'caching-compiler@1.2.2',
        'babel-compiler@7.9.0',
        'typescript@3.0.0 || 4.0.0 || 5.0.0',
    ],
    sources: [
        'build.ts',
        'workers.ts',
        'plugin/Compiler.ts',
        'plugin/IntermediaryMeteorProject.ts',
        'utility/Logger.ts',
        'utility/Helpers.ts',
        'utility/Errors.ts'
    ],
    npmDependencies: {
        execa: '6.1.0',
        'fs-extra': '10.1.0',
        'picocolors': '1.0.0',
    },
});

Npm.depends({
    'picocolors': '1.0.0',
});

Package.onUse(function (api) {
    api.versionsFrom(['2.8.2', '2.12', '2.16']);
    api.use([
        'fetch',
        'webapp',
        'mongo',
        'typescript@3.0.0 || 4.0.0 || 5.0.0',
        'isobuild:compiler-plugin@1.0.0',
    ]);
    api.use([
        'zodern:types@1.0.9',
    ], {
        weak: true,
    });
    api.addAssets(['loading/dev-server-splash.html'], 'server');
    api.mainModule('client.ts', 'client');
    api.mainModule('vite-server.ts', 'server');
});

