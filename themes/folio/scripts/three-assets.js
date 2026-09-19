'use strict';

const fs = require('node:fs');
const path = require('node:path');

// Publish the matching renderer and core from the locked npm dependency.
// three.module.js imports ./three.core.js; both must be served together.
hexo.extend.generator.register('three-assets', () => {
  const build = path.dirname(require.resolve('three'));
  return ['three.module.js', 'three.core.js'].map(file => ({
    path: `js/${file}`,
    data: fs.readFileSync(path.join(build, file))
  })).concat({
    path: 'js/three-LICENSE.txt',
    data: fs.readFileSync(path.join(build, '..', 'LICENSE'))
  });
});
