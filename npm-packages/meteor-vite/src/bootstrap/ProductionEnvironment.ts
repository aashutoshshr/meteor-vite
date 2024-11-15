import type * as _ from  'meteor/jorgenvatle:vite';
import { Meteor } from 'meteor/meteor';
import { WebAppInternals, WebApp } from 'meteor/webapp';
import { ViteProductionBoilerplate } from '../meteor/boilerplate/Production';
import type { ViteManifestFile } from '../meteor/IPC/methods/build';
import Logger from '../utilities/Logger';

Meteor.startup(async () => {
    console.log('[Vite] Fetching manifest...');
    const manifest = await Assets.getTextAsync('vite/client.manifest.json');
    const files: Record<string, ViteManifestFile> = JSON.parse(manifest);
    
    // Todo: retrieve base and assets dir from build config/manifest file
    const boilerplate = new ViteProductionBoilerplate({
        base: 'vite',
        assetsDir: 'vite',
        files,
    });
    
    // Todo: Instead of serving assets with Meteor's built-in static file handler,
    //  add a custom asset route where we have better control over caching and CORS rules.
    boilerplate.makeViteAssetsCacheable();
    
    WebAppInternals.registerBoilerplateDataCallback('vite', async (req, data) => {
        try {
            const { dynamicBody, dynamicHead } = boilerplate.getBoilerplate();
            
            if (dynamicHead) {
                data.dynamicHead = `${data.dynamicHead || ''}\n${dynamicHead}`;
            }
            
            if (dynamicBody) {
                data.dynamicBody = `${data.dynamicBody || ''}\n${dynamicBody}`;
            }
        } catch (error) {
            console.warn(error);
            throw error;
        }
    });
    
    WebApp.connectHandlers.use(boilerplate.baseUrl, (req, res, next) => {
        res.writeHead(404, 'Not found');
        res.write('Vite asset could not be found');
        Logger.warn(`Served 404 for unknown Vite asset: ${req.originalUrl}`);
        res.end();
    })
})

