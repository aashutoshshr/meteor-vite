#!/usr/bin/env bash
# shellcheck disable=SC2120

# Simple utility script for managing the example apps.
# Usage: ./examples.sh <app> <action>
# e.g. ./examples.sh vue start      # (Start the Vue example in development mode)
# e.g. ./examples.sh svelte launch  # (Build for production, then start the production Svelte app)

# Alternatively, you can access the script though npm at the root of the repo:
# Usage: npm run example <app> <action> -- <args>
# e.g. npm run example vue build
# e.g. npm run example vue start -- --port 3030

this="$0"
action="$1" # e.g. link, build, start
app="$2" # e.g. vue, svelte

npm="meteor npm"
node="meteor node"

EXAMPLE_DIR="$PWD/examples"
APP_DIR="$EXAMPLE_DIR/$app"
BUILD_TARGET="$PWD/examples/output/$app"
NPM_LINK_TARGET="$PWD/npm-packages/meteor-vite"
METEOR_LOCAL_DIR_ORIGINAL="$APP_DIR/.meteor/local"
METEOR_LOCAL_DIR_ROOT="/tmp/.meteor-local/meteor-vite/examples"
METEOR_LOCAL_DIR="$METEOR_LOCAL_DIR_ROOT/$app"

export METEOR_PACKAGE_DIRS="$PWD/packages:$PWD/test-packages/atmosphere"
export METEOR_VITE_TSUP_BUILD_WATCHER="${METEOR_VITE_TSUP_BUILD_WATCHER:-'true'}"

if [ "$USE_METEOR_BINARIES" == "0" ]; then
  npm="npm"
  node="node"
fi

# Add symlink to original local directory to work around warnings from zodern:types
mkdir -p "$METEOR_LOCAL_DIR"
rm -rf "$METEOR_LOCAL_DIR_ORIGINAL"
ln -s "$METEOR_LOCAL_DIR" "$METEOR_LOCAL_DIR_ORIGINAL"

# Port for the Meteor app in examples/.mongo
# Used just for the MongoDB server that comes out of the box with Meteor.
# Which comes in handy when testing production bundles that depend on a Mongo connection to launch.
PROD_MONGO_METEOR_PORT=4040
PROD_MONGO_CONNECTION_URI="mongodb://127.0.0.1:$(($PROD_MONGO_METEOR_PORT + 1))/$app"

# Start a development server
start() {
  cd "$APP_DIR" || exit 1
  $npm start -- "$@"
}

# Run a command in the context of the provided example app
run() {
  cd "$APP_DIR" || exit 1
  "$@"
}

# Install dependencies for dev app
install() {
  cd "$APP_DIR" || exit 1
  $npm i "$@"
}

# Initial setup for example apps - installs and links our local packages.
prepare() {
  $npm run install:package
  $npm run build:package

  (install) || exit 1
  (link) || exit 1
}

# Build an example app for production
build() {
    (link) || exit 1
    (cleanOutput) || exit 1

    ## Disable file watcher for meteor-vite npm package to prevent builds from hanging indefinitely
    METEOR_VITE_TSUP_BUILD_WATCHER="false"
    local extraArgs=""

    if [ "$DEBUG" == "1" ]; then
      extraArgs="--debug"
    fi


    cd "$APP_DIR" || exit 1
    meteor build "$BUILD_TARGET" --directory "$@" $extraArgs
}

update() {
  cd "$APP_DIR" || exit 1
  meteor update --release "$@"
}

# Build then start a production app
launch() {
  (build) || exit 1
  chmod +w -R "$BUILD_TARGET" # Allow writes to the build, very handy for tinkering with the builds

  start:production
}

# Start an already built production app
start:production() {
  (production:install) || exit 1
  (install:mongo) || exit 1

  local PRODUCTION_SERVER="$this production:app $app"
  local MONGO_SERVER="$this start:mongo" # Use the Meteor dev server to run a local MongoDB instance

  concurrently --names "PROD,MongoDB" --prefixColors "cyan,dim" "$PRODUCTION_SERVER" "$MONGO_SERVER"
}

install:mongo() {
  cd "$EXAMPLE_DIR/.mongo" || exit 1
  $npm i
}

start:mongo() {
  cd "$EXAMPLE_DIR/.mongo" || exit 1
  export METEOR_LOCAL_DIR="$METEOR_LOCAL_DIR_ROOT/.mongo"
  $npm start -- --port $PROD_MONGO_METEOR_PORT
}

cleanOutput() {
  rm -rf "$BUILD_TARGET"
}

link() {
  cd "$APP_DIR" || exit 1
  $npm link "$NPM_LINK_TARGET"
}

production:install() {
   cd "$BUILD_TARGET/bundle/programs/server" || exit 1
   chmod +w npm-shrinkwrap.json
   $npm install
}

production:app() {
  cd "$BUILD_TARGET/bundle" || exit 1

  export PORT=3000
  export ROOT_URL=http://localhost:3000
  export MONGO_URL="$PROD_MONGO_CONNECTION_URI"

  $node main.js
}

set -x
"$action" "${@:3}" || exit 1
