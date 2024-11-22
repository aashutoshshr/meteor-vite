import FS from 'fs/promises';
import Path from 'path';
import pc from 'picocolors';
import type { Environment, Plugin, ViteDevServer } from 'vite';
import PackageJSON from '../../package.json';
import { createErrorHandler } from '../error/ErrorHandler';
import { MeteorViteError } from '../error/MeteorViteError';
import MeteorPackage from '../meteor/package/components/MeteorPackage';
import { stubTemplate } from '../meteor/package/StubTemplate';
import ViteLoadRequest from '../ViteLoadRequest';
import { type PluginSettings, ResolvedMeteorViteConfig } from '../VitePluginSettings';

export const MeteorStubs: () => Promise<Plugin> = setupPlugin(async () => {
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
        async setupContext(viteId, server, pluginSettings: ResolvedPluginConfig, environment) {
            return ViteLoadRequest.prepareContext({ id: viteId, pluginSettings, server, environment });
        },
        
        async load(request) {
            console.log({ plugSettings: request.context.pluginSettings });
            const timeStarted = Date.now();
            
            if (request.isLazyLoaded) {
                await request.forceImport();
            }
            
            if (globalThis?.MeteorViteRuntimeConfig?.productionPreview) {
                return loadCachedStubTemplate(request);
            }
            
            const meteorPackage = await MeteorPackage.parse({
                filePath: request.context.file.sourcePath,
                fileContent: request.context.file.content,
            }, {
                ignoreDuplicateExportsInPackages: request.context.pluginSettings.stubValidation.ignoreDuplicateExportsInPackages,
                viteEnv: request.context.environment.name,
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
            
            if (request.context.pluginSettings.meteorStubs.debug || globalThis?.MeteorViteRuntimeConfig?.productionPreview) {
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
    const { templatePath, parserPath, packagePath, baseDir } = request.cache;
    
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

async function loadCachedStubTemplate(request: ViteLoadRequest) {
    return FS.readFile(request.cache.templatePath, 'utf-8');
}

/**
 * Vite plugin options wrapper.
 * Just a utility to set up catch blocks for nicer error handling as well as pre-populating the load() handler with
 * the request context from {@link ViteLoadRequest}.
 */
function setupPlugin<Context extends ViteLoadRequest>(setup: () => Promise<{
    name: string;
    load(request: Context): Promise<string>;
    validateConfig(settings: PluginSettings): Promise<void>,
    setupContext(viteId: string, server: ViteDevServer, settings: PluginSettings, environment: Environment): Promise<Context>;
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
                const pluginSettings = (resolvedConfig as ResolvedMeteorViteConfig).meteor;
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
            async load(viteId: string) {
                const shouldProcess = plugin.shouldProcess(viteId);
                
                if (!shouldProcess) {
                    return;
                }
                
                const request = await plugin.setupContext(viteId, server, settings, this.environment);
                
                return plugin.load.apply(this, [request]).catch(
                    createErrorHandler('Could not parse Meteor package', request)
                )
            },
        };
    }
    
    return () => createPlugin().catch(handleError)
}


type ResolvedPluginConfig = Required<PluginSettings> & { meteorStubs: Required<PluginSettings['meteorStubs']> };

