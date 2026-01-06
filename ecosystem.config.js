const path = require('path');

module.exports = {
  apps: [
    {
      name: 'katapump-mod-bot',
      script: 'src/index.js',
      cwd: path.resolve(__dirname), // Ensure PM2 runs from project root
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};