import { cwd, getProjectPackageJson } from '../workers';
import Path from 'node:path';
import OS from 'node:os';
import FS from 'node:fs';
import { MeteorViteError } from './Errors';

export function msToHumanTime(milliseconds: number) {
    const duration = {
        count: milliseconds,
        type: 'ms',
    }
    
    if (milliseconds > 1000) {
        duration.count = milliseconds / 1000;
        duration.type = 's';
    }
    
    if (duration.type === 's' && duration.count > 60) {
        duration.type = 'min'
        duration.count = duration.count / 60;
    }
    
    return `${Math.round(duration.count * 100) / 100}${duration.type}`;
}

export function posixPath(filePath: string) {
    return filePath.split(Path.sep).join('/')
}

export function getTempDir() {
    const packageJson = getProjectPackageJson();
    const tempRootDir = packageJson?.meteor?.vite?.tempBuildDir || OS.tmpdir();
    
    try {
        const tempDir = Path.resolve(tempRootDir, 'meteor-vite', packageJson.name);
        FS.mkdirSync(tempDir, { recursive: true });
        return tempDir;
    } catch (error) {
        console.warn(new MeteorViteError(`Unable to set up temp directory for meteor-vite bundles. Will use node_modules instead`, { cause: error }));
        return Path.resolve(cwd, 'node_modules', '.vite-meteor-temp');
    }
}

export function getBuildConfig() {
    const packageJson = getProjectPackageJson();
    const tempDir = getTempDir();
    
    // Not in a project (publishing the package or in temporary Meteor build)
    const pluginEnabled = !process.env.VITE_METEOR_DISABLED;
    
    /**
     * Meteor client mainModule as specified in the package.json file. This is where we will push the final Vite bundle.
     */
    const meteorMainModule = packageJson.meteor?.mainModule?.client
    
    /**
     * Entry module for the final Vite bundle. (Not the entrypoint specified in the Vite plugin config)
     * This is appended to the Meteor client's mainModule to force Meteor into loading files built by Vite.
     */
    const entryModule = Path.join('meteor-vite', '.build', 'import-vite-bundle.js');
    const entryModuleFilepath = Path.join(cwd, 'node_modules', entryModule)
    
    /**
     * Check if Meteor is running using the --production flag and not actually bundling for production.
     * This is important to check for as we normally clean up the files created for production once our compiler
     * plugin finishes.
     */
    const isSimulatedProduction = process.argv.includes('--production');
    
    /**
     * Intermediary Meteor project - used to build the Vite bundle in a safe environment where all the Meteor
     * packages from the source project are available to our Vite plugin to analyze for creating ESM export stubs.
     */
    const tempMeteorProject = Path.resolve(tempDir, 'meteor') // Temporary Meteor project source
    const tempMeteorOutDir = Path.join(tempDir, 'bundle', 'meteor'); // Temporary Meteor production bundle
    
    /**
     * Destination directory inside the source Meteor project for the transpiled Vite bundle.
     * This is what is fed into Meteor at the end of the build process.
     */
    const viteOutSrcDir = Path.join(cwd, 'client', 'vite')
    
    
    if (pluginEnabled && !packageJson.meteor.mainModule) {
        throw new MeteorViteError('No meteor main module found, please add meteor.mainModule.client to your package.json')
    }
    
    return {
        packageJson,
        tempMeteorOutDir,
        tempMeteorProject,
        isSimulatedProduction,
        entryModule,
        entryModuleFilepath,
        meteorMainModule,
        pluginEnabled,
        viteOutSrcDir,
    }
}
