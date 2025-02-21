import { defineConfig } from 'tsup';
import metaUrlPlugin from '@chialab/esbuild-plugin-meta-url';

export default defineConfig({
    entry: ['src/client.js'],
    format: ['cjs', 'esm'],
    target: 'node22',
    clean: true,
    esbuildPlugins: [
      metaUrlPlugin()
    ]
});
