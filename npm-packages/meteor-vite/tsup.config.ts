import FS from 'fs';
import Path from 'path';
import { defineConfig } from 'tsup';
import { EsbuildPluginMeteorStubs } from '../../tsup.config';

export default defineConfig([
    // Internal entry points
    {
        name: 'meteor-vite/internals',
        entry: [
            './src/client/index.ts',
            './src/bootstrap/index.ts',
            './src/bootstrap/DevServerHMR.ts',
            './src/bootstrap/ProductionEnvironment.ts',
        ],
        outDir: 'dist',
        format: 'esm',
        sourcemap: true,
        target: 'node20',
        keepNames: true,
        dts: false,
        onSuccess: async () => {
            try {
                const atmospherePackageOutDir = Path.join(__dirname, '..', '..', 'packages', 'vite', 'dist');
                FS.appendFileSync(Path.join(atmospherePackageOutDir, 'server.mjs'), '\n // Forcing reload');
                FS.appendFileSync(Path.join(atmospherePackageOutDir, 'server.js'), '\n // Forcing reload');
            } catch (error) {
                console.warn(error);
            }
        },
        noExternal: ['meteor'],
        esbuildPlugins: [
            EsbuildPluginMeteorStubs,
        ]
    },
    
    // Plugin entry
    {
        name: 'meteor-vite/internals',
        entry: [
            './src/plugin/index.ts',
        ],
        outDir: 'dist/plugin',
        format: [
            'cjs',
            'esm',
        ],
        sourcemap: true,
        keepNames: true,
        dts: true,
    },
]);