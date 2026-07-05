const path = require('path');
const dotenv = require('dotenv');

const projectRoot = path.resolve(__dirname, '..');
const envPath = path.join(projectRoot, '.env');

if (require('fs').existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config({ path: path.join(projectRoot, '.env.example') });
}

const app = require('./src/app');
const logger = require('./src/utils/logger');
const { ensureAppTables } = require('./src/scripts/create_app_tables');

const port = process.env.PORT || 3030;

ensureAppTables()
  .then(() => {
    app.listen(port, () => {
      logger.info(`Server listening on port ${port}`);
      console.log(`Server listening on port ${port}`);
    });
  })
  .catch(err => {
    logger.error('Failed to create required database tables:', err);
    console.error('Failed to create required database tables:', err);
    process.exit(1);
  });
