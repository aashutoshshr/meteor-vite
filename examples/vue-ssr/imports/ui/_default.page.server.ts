// See https://vite-plugin-ssr.com/data-fetching
export const passToClient = ['pageProps', 'urlPathname'];
import { WebApp } from 'meteor/webapp';
import { Meteor } from 'meteor/meteor';

import { renderToString as renderToString_ } from '@vue/server-renderer'
import type { App } from 'vue'
import { escapeInject, dangerouslySkipEscape } from 'vite-plugin-ssr/server'
import { createApp } from './ssr-render/App'
import logoUrl from './ssr-render/logo.svg'
import type { PageContextServer } from './Types'

export async function render(pageContext: PageContextServer) {
    const { Page, pageProps } = pageContext
    // This render() hook only supports SSR, see https://vite-plugin-ssr.com/render-modes for how to modify render() to support SPA
    if (!Page) throw new Error('My render() hook expects pageContext.Page to be defined')
    const app = createApp(Page, pageProps, pageContext)
    
    const appHtml = await renderToString(app)
    
    // See https://vite-plugin-ssr.com/head
    const { documentProps } = pageContext.exports
    const title = (documentProps && documentProps.title) || 'Vite SSR app'
    const desc = (documentProps && documentProps.description) || 'App using Vite + vite-plugin-ssr'
    
    const documentHtml = escapeInject`<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <link rel="icon" href="${logoUrl}" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="${desc}" />
        <title>${title}</title>
        ${dangerouslySkipEscape(meteorSetupTemplate())}
      </head>
      <body>
        <div id="app">${dangerouslySkipEscape(appHtml)}</div>
      </body>
    </html>`
    
    return {
        documentHtml,
        pageContext: {
            // We can add some `pageContext` here, which is useful if we want to do page redirection https://vite-plugin-ssr.com/page-redirection
        }
    }
}

function meteorSetupTemplate(arc = 'web.browser') {
    if (Meteor.isClient) return '';
    
    const clientPrograms = WebApp.clientPrograms[arc];
    const clientScripts = clientPrograms.manifest.filter((program) => program.type === 'js').map((entry) => {
        return `<script src="${entry.url}"></script>`
    });
    return [
        `<script src="/__meteor-vite/meteor/__meteor_runtime_config__.js?arc=${arc}"></script>`,
        ...clientScripts
    ].join('\n')
}

async function renderToString(app: App) {
    let err: unknown
    // Workaround: renderToString_() swallows errors in production, see https://github.com/vuejs/core/issues/7876
    app.config.errorHandler = (err_) => {
        err = err_
    }
    const appHtml = await renderToString_(app)
    if (err) throw err
    return appHtml
}