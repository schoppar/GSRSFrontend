// These are important and needed before anything else
import 'zone.js/dist/zone-node';
import 'reflect-metadata';

import { enableProdMode } from '@angular/core';

import * as express from 'express';
import { join } from 'path';
import * as helmet from 'helmet';
import * as compression from 'compression';

// Faster server renders w/ Prod mode (dev mode never needed)
enableProdMode();

// Express server
const app = express();
app.use(helmet());
app.use(compression());
const PORT = process.env.PORT || 4000;
const DIST_FOLDER = join(process.cwd(), 'dist');

// * NOTE :: leave this as require() since this file is built Dynamically from webpack
const { AppServerModuleNgFactory, LAZY_MODULE_MAP, ngExpressEngine, provideModuleMap } = require('./dist/server/main');

// Express Engine
//import { ngExpressEngine } from '@nguniversal/express-engine';
// Import module map for lazy loading
//import { provideModuleMap } from '@nguniversal/module-map-ngfactory-loader';
//const { provideModuleMap } = require('@nguniversal/module-map-ngfactory-loader');

app.engine('html', ngExpressEngine({
  bootstrap: AppServerModuleNgFactory,
  providers: [
    provideModuleMap(LAZY_MODULE_MAP)
  ]
}));

app.set('view engine', 'html');
app.set('views', join(DIST_FOLDER, 'browser'));

// TODO: implement data requests securely
app.get('/api/*', (req, res) => {
  res.status(404).send('data requests are not supported');
});

// Server static files from /browser
// app.get('*.*', express.static(join(DIST_FOLDER, 'browser')));

// START test implementation in java/play server
app.get('/ginas/app/beta*.*', (req, res) => {
  console.log(req.path);
  const path = req.path.replace('/ginas/app/beta', '');
  res.sendFile(join(DIST_FOLDER, 'browser' + path));
});
app.get('*.*', (req, res) => {
  res.status(404).send('Add the right path buddy!');
});
// END

// All regular routes use the Universal engine
app.get('*', (req, res) => {
  res.render('index', { req });
});

// Start up the Node server
app.listen(PORT, () => {
  console.log(`Node server listening on http://localhost:${PORT}`);
});
