const db = require('../db');

async function ensureAppTables() {
  await db.run(`
    CREATE TABLE IF NOT EXISTS movies (
      id INT PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      release_year SMALLINT,
      rental_rate DECIMAL(4,2),
      length SMALLINT,
      active TINYINT DEFAULT 1
    )
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS movie_rentals (
      id INT PRIMARY KEY AUTO_INCREMENT,
      movie_id INT NOT NULL,
      customer_id INT NOT NULL,
      rented_at DATETIME NOT NULL,
      due_at DATETIME NOT NULL,
      returned_at DATETIME NULL,
      FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
    )
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      google_id VARCHAR(255) UNIQUE,
      email VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(255),
      role VARCHAR(50) DEFAULT 'Customer',
      verified TINYINT DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS revoked_tokens (
      id INT PRIMARY KEY AUTO_INCREMENT,
      jti VARCHAR(100) NOT NULL UNIQUE,
      expires_at BIGINT NOT NULL
    )
  `);
}

async function run() {
  await ensureAppTables();

  try {
    const movies = await db.all('SELECT id, title, description, release_year, rental_rate, length FROM movies');
    if (movies && movies.length) {
      console.log(`Found ${movies.length} movies in the movies table.`);
    } else {
      console.log('No movie data found in the movies table; you can add records from the app UI.');
    }
  } catch (error) {
    console.warn('Unable to inspect the movies table:', error.message);
  }

  console.log('App tables created or verified.');
  process.exit(0);
}

if (require.main === module) {
  run().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { ensureAppTables };
