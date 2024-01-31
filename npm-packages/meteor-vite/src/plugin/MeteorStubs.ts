import FS from 'fs/promises';
import Path from 'path';
import pc from 'picocolors';
import type { PluginContext } from 'rollup';
import type { Plugin, ViteDevServer } from 'vite';
import PackageJSON from '../../package.json';
import { createErrorHandler } from '../error/ErrorHandler';
import { MeteorViteError } from '../error/MeteorViteError';
import MeteorPackage from '../meteor/package/components/MeteorPackage';
import { stubTemplate } from '../meteor/package/StubTemplate';
import { MeteorViteConfig } from '../MeteorViteConfig';
import ViteLoadRequest from '../ViteLoadRequest';
import { PluginSettings } from './Meteor';

export const MeteorStubs = setupPlugin(async () => {
    return {
        name: 'meteor-vite: stubs',
        resolveId: (id) => ViteLoadRequest.resolveId(id),
        shouldProcess: (viteId) => ViteLoadRequest.isStubRequest(viteId),
        async validateConfig({ meteorStubs }: ResolvedPluginConfig) {
            if (!meteorStubs.packageJson) {
                const jsonPath = meteorStubs.packageJsonPath || 'package.json';
                meteorStubs.packageJson = JSON.parse(await FS.readFile(jsonPath, 'utf-8'));
            }
            if (!meteorStubs?.packageJson?.meteor?.mainModule?.client) {
                throw new MeteorViteError(`You need to specify a Meteor entrypoint in your package.json!`, {
                    subtitle: `See the following link for more info: ${PackageJSON.homepage}`
                })
            }
        },
        async setupContext(viteId, server, pluginSettings: ResolvedPluginConfig) {
            return ViteLoadRequest.prepareContext({ id: viteId, pluginSettings, server });
        },
        
        async load(request) {
            const timeStarted = Date.now();
            
            if (request.isLazyLoaded) {
                await request.forceImport();
            }
            
            const meteorPackage = await MeteorPackage.parse({
                filePath: request.context.file.sourcePath,
                fileContent: request.context.file.content,
            });
            
            const template = stubTemplate({
                requestId: request.context.id,
                importPath: request.requestedModulePath,
                stubValidation: request.context.pluginSettings.stubValidation,
                meteorPackage,
            })
            
            request.log.debug(`Meteor stub created`, {
                'Parse time': meteorPackage.meta.timeSpent,
                'Request duration': `${Date.now() - timeStarted}ms`,
            });
            
            if (request.context.pluginSettings.meteorStubs.debug) {
                await storeDebugSnippet({ request, stubTemplate: template, meteorPackage })
            }
            
            return template;
        },
    }
})

async function storeDebugSnippet({ request, stubTemplate, meteorPackage }: {
    request: ViteLoadRequest,
    stubTemplate: string,
    meteorPackage: MeteorPackage,
}) {
    const baseDir = Path.join(request.context.pluginSettings.tempDir, 'stubs', request.context.file.packageId.replace(':', '_'));
    const templatePath = Path.join(baseDir, request.context.file.importPath || '', 'template.js');
    const packagePath = Path.join(baseDir, 'package.js');
    const parserPath = Path.join(baseDir, 'parsed.json');
    
    await FS.mkdir(Path.dirname(templatePath), { recursive: true });
    
    await Promise.all([
        FS.writeFile(templatePath, stubTemplate),
        FS.writeFile(packagePath, await request.context.file.content),
        FS.writeFile(parserPath, meteorPackage.toJson())
    ]);
    
    request.log.info('Stored debug snippets', {
        File: pc.cyan(baseDir),
    })
}

/**
 * Vite plugin options wrapper.
 * Just a utility to set up catch blocks for nicer error handling as well as pre-populating the load() handler with
 * the request context from {@link ViteLoadRequest}.
 */
function setupPlugin<Context extends ViteLoadRequest>(setup: () => Promise<{
    name: string;
    load(this: PluginContext, request: Context): Promise<string>;
    validateConfig(settings: PluginSettings): Promise<void>,
    setupContext(viteId: string, server: ViteDevServer, settings: PluginSettings): Promise<Context>;
    shouldProcess(viteId: string): boolean;
    resolveId(viteId: string): string | undefined;
}>): () => Promise<Plugin> {
    const handleError = createErrorHandler('Could not set up Vite plugin!');
    
    const createPlugin = async (): Promise<Plugin> => {
        const plugin = await setup();
        let settings: PluginSettings;
        let server: ViteDevServer;
        return {
            name: plugin.name,
            resolveId: plugin.resolveId,
            async configResolved(resolvedConfig) {
                const pluginSettings = (resolvedConfig as MeteorViteConfig).meteor;
                if (!pluginSettings) {
                    throw new MeteorViteError('Unable to get configuration for Meteor-Vite!');
                }
                try {
                    settings = pluginSettings;
                    await plugin.validateConfig(pluginSettings);
                } catch (error) {
                    await handleError(error);
                }
            },
            configureServer(viteDevServer) {
                server = viteDevServer;
            },
            async load(this: PluginContext, viteId: string) {
                const shouldProcess = plugin.shouldProcess(viteId);
                
                if (!shouldProcess) {
                    return;
                }
                
                const request = await plugin.setupContext(viteId, server, settings);
                
                return plugin.load.apply(this, [request]).catch(
                    createErrorHandler('Could not parse Meteor package', request)
                )
            },
        }
    }
    
    return () => createPlugin().catch(handleError)
}


export interface MeteorStubsSettings {
    
    meteor: {
        /**
         * Path to Meteor's internal package cache.
         * This can change independently of the isopack path depending on whether we're building for production or
         * serving up the dev server.
         *
         * @example {@link /examples/vue/.meteor/local/build/programs/web.browser/packages}
         */
        packagePath: string;
        
        /**
         * Path to Meteor's local Isopacks store. Used to determine where a package's mainModule is located and whether
         * the package has lazy-loaded modules. During production builds this would be pulled from a temporary
         * Meteor build, so that we have solid metadata to use when creating Meteor package stubs.
         *
         * @example {@link /examples/vue/.meteor/local/isopacks/}
         */
        isopackPath: string;
        
        /**
         * Path to the current user's Meteor package cache. (e.g. /home/john/.meteor/packages)
         * This is used to build up a fallback path for isopack manifests.
         *
         * Some packages, like `react-meteor-data` do not emit a isopack metadata file within the current project's
         * .meteor/local directory. So we have to resort to pulling in Isopack metadata from the `meteor-tool` cache.
         *
         * @example `react-meteor-data` path
         * /home/john/.meteor/packages/react-meteor-data/2.7.2/web.browser.json
         */
        globalMeteorPackagesDir?: string;
    }
    
    /**
     * Full content of the user's Meteor project package.json.
     * Like the one found in {@link /examples/vue/package.json}
     */
    packageJson?: ProjectJson;
    
    /**
     * Alternatively, a path to a package.json file can be supplied.
     */
    packageJsonPath?: string;
    
    /**
     * Enabling debug mode will write all input and output files to a `.meteor-vite` directory in the Meteor project's
     * root. Handy for quickly assessing how things are being formatted, or for use in writing up new test cases for
     * meteor-vite.
     */
    debug?: boolean;
    
}

type ResolvedPluginConfig = Required<PluginSettings>;

/**
 * The user's Meteor project package.json content.
 * todo: expand types
 */
export type ProjectJson = {
    name: string;
    dependencies: {
        'meteor-vite'?: string;
    }
    devDependencies: {
        'meteor-vite'?: string;
    }
    meteor: {
        mainModule: {
            client: string;
        },
        /**
         * @deprecated Use meteor.vite.configFile instead.
         * See {@link https://github.com/JorgenVatle/meteor-vite?tab=readme-ov-file#configuration configuration} for
         * example.
         */
        viteConfig?: string;
        vite?: {
            /**
             * Specifies an alternative path to the project's Vite config
             */
            configFile?: string;
            
            /**
             * Remove or replace Meteor packages when preparing the intermediary production build.
             * Does not affect your final production bundle. It's only used as a temporary build step.
             */
            replacePackages?: {
                startsWith: string; // Match any Meteor package name that starts with the provided string.
                replaceWith: string; // Replace matching packages with the provided string.
            }[];
            
            /**
             * Override the directory path used for preparing the Vite production bundle.
             * Might be useful if the automatically generated file path is inaccessible in your operating system
             */
            tempBuildDir?: string;
        }
    }
}
