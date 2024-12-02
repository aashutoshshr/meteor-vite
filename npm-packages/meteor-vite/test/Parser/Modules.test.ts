import generate from '@babel/generator';
import { parse } from '@babel/parser';
import { isAssignmentExpression, traverse } from '@babel/types';
import Path from 'path';
import { describe, it } from 'vitest';
import FS from 'fs/promises';
import { parseMeteorPackage } from '../../src/entry/plugin/meteor/parser/Parser';

describe('Client modules bundle', () => {
    it('can resolve npm packages', async () => {
        const filePath = Path.join(__dirname, '../__mocks/meteor-bundle/meteor-v2/example.react.modules.js.bundle');
        const meteorPackage = await parseMeteorPackage({ filePath });
        
        
        // traverse(parse('\n' +
        //     'if (process.env.NODE_ENV === \'production\') {\n' +
        //     '  module.exports = require(\'./cjs/react.production.min.js\');\n' +
        //     '} else {\n' +
        //     '  module.exports = require(\'./cjs/react.development.js\');\n' +
        //     '}\n'), {
        //     enter(node) {
        //         if (isAssignmentExpression(node)) {
        //             console.log(generate(node))
        //         }
        //         // console.log(node);
        //     }
        // })
      
        meteorPackage.result.node_modules?.forEach((e) => console.log(e.modules));
    })
})