import path from 'node:path'
import { performance } from 'node:perf_hooks'
import fs from 'fs-extra'
import { execaSync } from 'execa'
import pc from 'picocolors'
import { createWorkerFork, cwd, getProjectPackageJson, getTempDir } from './workers';
import EntryFile from './build/EntryFile';
import Path from 'path';

if (process.env.NODE_ENV !== 'production') return

// Not in a project (publishing the package)
if (process.env.VITE_METEOR_DISABLED) return

const pkg = getProjectPackageJson();
const entryFile = EntryFile.retrieve(pkg);

// Meteor packages to omit or replace the temporary build.
// Useful for other build-time packages that may conflict with Meteor-Vite's temporary build.
const replaceMeteorPackages = [
  { startsWith: 'standard-minifier', replaceWith: '' },
  { startsWith: 'refapp:meteor-typescript', replaceWith: 'typescript' },
  ...pkg?.meteorVite?.replacePackages || []
]

const tempDir = getTempDir();
const tempMeteorProject = path.resolve(tempDir, 'input', 'meteor')
const tempMeteorOutDir = path.join(tempDir, 'output', 'meteor')
const viteOutDir = path.join(tempDir, 'output', 'vite');

// Temporary Meteor build

const filesToCopy = [
  path.join('.meteor', '.finished-upgraders'),
  path.join('.meteor', '.id'),
  path.join('.meteor', 'packages'),
  path.join('.meteor', 'platforms'),
  path.join('.meteor', 'release'),
  path.join('.meteor', 'versions'),
  'package.json',
  entryFile.client.relativePath,
]

const optionalFiles = [
    'tsconfig.json'
]

try {
  // Temporary Meteor build

  console.log(pc.blue('⚡️ Building packages to make them available to export analyzer...'))
  let startTime = performance.now()

  // Check for project files that may be important if available
  for (const file of optionalFiles) {
    if (fs.existsSync(path.join(cwd, file))) {
      filesToCopy.push(file);
    }
  }

  // Copy files from `.meteor`
  for (const file of filesToCopy) {
    const from = path.join(cwd, file)
    const to = path.join(tempMeteorProject, file)
    fs.ensureDirSync(path.dirname(to))
    fs.copyFileSync(from, to)
  }

  // Symblink to `packages` folder
  if (fs.existsSync(path.join(cwd, 'packages')) && !fs.existsSync(path.join(tempMeteorProject, 'packages'))) {
    fs.symlinkSync(path.join(cwd, 'packages'), path.join(tempMeteorProject, 'packages'))
  }
  // Remove/replace conflicting Atmosphere packages
  {
    const file = path.join(tempMeteorProject, '.meteor', 'packages')
    let content = fs.readFileSync(file, 'utf8')
    for (const pack of replaceMeteorPackages) {
      const lines = content.split('\n')
      content = lines.map(line => {
        if (!line.startsWith(pack.startsWith)) {
          return line;
        }
        return pack.replaceWith || '';
      }).join('\n')
    }
    fs.writeFileSync(file, content)
  }
  // Remove server entry
  {
    const file = path.join(tempMeteorProject, 'package.json')
    const data = JSON.parse(fs.readFileSync(file, 'utf8'))
    data.meteor = {
      mainModule: {
        client: data.meteor.mainModule.client,
      },
    }
    fs.writeFileSync(file, JSON.stringify(data, null, 2))
  }
  // Only keep meteor package imports to enable lazy packages
  {
    const file = path.join(tempMeteorProject, entryFile.client.relativePath)
    const lines = fs.readFileSync(file, 'utf8').split('\n')
    const imports = lines.filter(line => line.startsWith('import') && line.includes('meteor/'))
    fs.writeFileSync(file, imports.join('\n'))
  }
  execaSync('meteor', [
    'build',
    tempMeteorOutDir,
    '--directory',
  ], {
    cwd: tempMeteorProject,
    // stdio: ['inherit', 'inherit', 'inherit'],
    env: {
      FORCE_COLOR: '3',
      VITE_METEOR_DISABLED: 'true',
    },
  })
  let endTime = performance.now()

  console.log(pc.green(`⚡️ Packages built (${Math.round((endTime - startTime) * 100) / 100}ms)`))

  // Vite

  console.log(pc.blue('⚡️ Building with Vite...'))
  startTime = performance.now()

  fs.ensureDirSync(path.dirname(viteOutDir))

  // Build with vite
  const { payload } = Promise.await(new Promise((resolve, reject) => {
    const worker = createWorkerFork({
      buildResult: (result) => resolve(result) ,
    });

    worker.call({
      method: 'buildForProduction',
      params: [{
        viteOutDir,
        packageJson: pkg,
        meteor: {
          packagePath: path.join(tempMeteorOutDir, 'bundle', 'programs', 'web.browser', 'packages'),
          isopackPath: path.join(tempMeteorProject, '.meteor', 'local', 'isopacks'),
        },
      }],
    })
  }))

  if (!payload.success) {
    throw new Error('Vite build failed')
  }

  endTime = performance.now()
  console.log(pc.green(`⚡️ Build successful (${Math.round((endTime - startTime) * 100) / 100}ms)`))

  // Add assets to Meteor
  const assets = {
    client: processOutput({
      files: payload.output.client,
      copyToPath: path.join(cwd, 'client', 'vite')
    }),
    server: processOutput({
      files: payload.output.server,
      copyToPath: path.join(cwd, 'server', 'vite')
    }),
  }


  class Compiler {
    processFilesForTarget (files) {
      files.forEach(file => {
        if (payload.build.target !== 'meteor') {
          file.addAsset({
            path: file.getPathInPackage(),
            data: file.getContentsAsBuffer(),
          })
          return;
        }
        switch (path.extname(file.getBasename())) {
          case '.js':
            file.addJavaScript({
              path: file.getPathInPackage(),
              data: file.getContentsAsString(),
            })
            break
          case '.css':
            file.addStylesheet({
              path: file.getPathInPackage(),
              data: file.getContentsAsString(),
            })
            break
          default:
            file.addAsset({
              path: file.getPathInPackage(),
              data: file.getContentsAsBuffer(),
            })
        }
      })
    }

    afterLink () {
      fs.removeSync(assets.client.targetDir);
      fs.removeSync(assets.server.targetDir);
      entryFile.client.cleanup();
      entryFile.server.cleanup();
    }
  }

  Plugin.registerCompiler({
    extensions: [],
    filenames: [assets.server.files, assets.client.files].flat().map((file) => file.fileName),
  }, () => new Compiler())
} catch (e) {
  throw e
} finally {
  console.log(pc.blue('⚡️ Cleaning up temporary files...'))
  fs.rmSync(tempDir, { recursive: true, force: true });
  console.log(pc.green('⚡️ Cleanup completed'))
}

function processOutput({ copyToPath, files }) {
  const entryAsset = files.client.find(o => o.fileName === 'meteor-entry.js' && o.type === 'chunk');

  if (!entryAsset) {
    throw new Error('No meteor-entry chunk found')
  }

  // Copy the assets to the Meteor auto-imported sources
  fs.ensureDirSync(copyToPath)
  fs.emptyDirSync(copyToPath)

  for (const file of files) {
    const from = file.absolutePath;
    const to = path.join(copyToPath, file.fileName);

    fs.ensureDirSync(path.dirname(to))

    if (path.extname(from) === '.js') {
      // Transpile to Meteor target (Dynamic import support)
      // @TODO don't use Babel
      const source = fs.readFileSync(from, 'utf8')
      const babelOptions = Babel.getDefaultOptions()
      babelOptions.babelrc = true
      babelOptions.sourceMaps = true
      babelOptions.filename = babelOptions.sourceFileName = from
      const transpiled = Babel.compile(source, babelOptions, {
        cacheDirectory: path.join(tempDir, '.babel-cache'),
      })
      fs.writeFileSync(to, transpiled.code, 'utf8')
    } else {
      fs.copyFileSync(from, to)
    }
  }

  // Patch meteor entry
  entryFile.client.addImport({ relative: path.join(copyToPath, entryAsset.fileName) });

  return {
    entryAsset,
    targetDir: copyToPath,
    files,
  };
}
