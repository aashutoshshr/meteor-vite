/// <reference types="vite/client" />
import { Meteor } from 'meteor/meteor';
import pc from 'picocolors';
import PackageJson from '../../package.json';

if (import.meta.hot) {
    import.meta.hot.on('vite:beforeFullReload', () => {
        const count = {
            methodHandles: pc.yellow(Object.keys(Meteor.server.method_handlers).length.toLocaleString()),
            publishHandlers: pc.yellow(Object.keys(Meteor.server.publish_handlers).length.toLocaleString()),
        }
        Meteor.server.method_handlers = {};
        Meteor.server.publish_handlers = {};
        console.info([
            `[${pc.cyan('HMR')}] Cleaned up ${count.methodHandles} method and ${count.publishHandlers} publish handlers`,
            pc.dim([
                'If there are other resources that persist after hot-reloading,',
                'please open an issue over on GitHub so we can have that taken care of.',
                `🐛 ${pc.blue(PackageJson.bugs.url)}`
            ].join('\n'))
        ].join('\n')
        );
    })
}
