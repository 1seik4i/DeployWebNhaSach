import { bootstrapDatabase } from './renderBootstrap.js';

const shouldBootstrap = process.env.NODE_ENV === 'production'
  || process.env.RENDER_BOOTSTRAP_DATABASE === 'true';

if (shouldBootstrap) {
  await bootstrapDatabase();
}

await import('../src/server.js');
