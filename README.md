[![Build Status](https://travis-ci.com/csci312a-s19/fp-rollrace.svg?token=Hyy79yxXoEwF3R53oyHK&branch=master)](https://travis-ci.com/csci312a-s19/fp-rollrace)

# Roll Race
Have you ever been sitting in lecture, bored out of your mind? Well sit no further!
Now introducing RollRace, an online, multiplayer racing game that soothes your
itch for a good time.

# Project Skeleton Top-level

This repository combines the client and server into a single repository that can be co-developed, tested and ultimately deployed to Heroku or basin.cs.middlebury.edu.

The client was created with [create-react-app](https://github.com/facebookincubator/create-react-app) (CRA) and the server is a separate Node.js application. The client-server integration is based on this [tutorial](https://www.fullstackreact.com/articles/using-create-react-app-with-a-server/) and [repository](https://github.com/fullstackreact/food-lookup-demo). This repository will be referred to as the "top-level" to distinguish it from the client and server.

## Installing (and Adding) Dependencies

The skeleton is structured as three separate packages. That is a "top-level" package and a separate "client" and "server". Thus initially installing dependencies is a 3 step process that runs "install" for each of the packages.

```
npm install
npm install --prefix client
npm install --prefix server
```

The `--prefix` option treats the supplied path as the package root. In this case it is equivalent to `cd client` then `npm install` then `cd ..`.

**You will typically not need to install any dependencies in the top-level `package.json` file**. Doing so is a common mistake. Most dependencies are needed by the client or the server and should be installed in the respective sub-packages, e.g. to install `reactstrap` for your client application:

```
npm install --save reactstrap --prefix client
```

In addition to installing dependencies, if you wish to run the application locally, you must run "npx knex migrate:latest" to intiallize the SQLITE DB.

## Running the Application

The combined application, client and server, can be run with `npm start` in the top-level directory. `npm start` launches the CRA development server on <http://localhost:3000> and the backend server on http://localhost:3001. By setting the `proxy` field in the client `package.json`, the client development server will proxy any unrecognized requests to the server. By default this starts the server in hot-reloading mode (like with the client application).

## Testing

The client application can be independently tested as described in the [CRA documentation](https://facebook.github.io/create-react-app/docs/running-tests), i.e.:

```
npm test --prefix client
```

The server can be similarly independently tested:

```
npm test --prefix server
```

## Linting

Both the client and server can be independently linted via:

```
npm run lint --prefix client
```

and

```
npm run lint --prefix server
```

To ensure consistent style we use the CRA-recommended [Prettier](https://github.com/prettier/prettier) package. We installed it in the "top-level" package with

```
npm install --save-dev husky lint-staged prettier
```

and added the recommended configuration to automatically reformat code during the commit. That is whenever you commit your code, Prettier will automatically reformat your code during the commit process (as a "hook"). The hook is specified in the top-level `package.json` file. The client and server has its own ESLint configuration.

We added custom ESLint rules to capture common errors. To ensure compatibility with Prettier, we also installed the `eslint-config-prettier` package in both the client and server to disable styling rules that conflict with Prettier.

```
npm install --save-dev eslint-config-prettier --prefix server
npm install --save-dev eslint-config-prettier --prefix client
```

and added an `"extends"` entry to `.eslintrc.json`.

## Continuous Integration

The skeleton is setup for CI with Travis-CI. Travis will build the client and test and lint both the client and the server.
