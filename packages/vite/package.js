Package.describe({
    name: 'jorgenvatle:vite',
    version: '1.0.0-alpha.0',
    summary: `⚡ Speeds up Meteor's build and HMR processes using Vite`,
    documentation: 'README.md'
});

Package.registerBuildPlugin({
    name: 'vite',
    use: [
        'ecmascript@0.16.9'
    ],
    sources: [
        'dist/build.mjs',
    ],
});

Package.onUse((api) => {
    api.versionsFrom(['3.0']);
    api.use([
        'isobuild:compiler-plugin@1.0.0',
        'ecmascript'
    ]);

    api.mainModule('dist/server.mjs', ['server'], { bare: false });
});