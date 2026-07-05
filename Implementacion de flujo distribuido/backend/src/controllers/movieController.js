const db = require('../db');
const logger = require('../utils/logger');

exports.list = async (req, res, next) => {
  try {
    const rows = await db.all(`
      SELECT m.id, m.title, m.description, m.release_year, m.rental_rate, m.length, m.active,
             CASE WHEN EXISTS (
               SELECT 1
               FROM movie_rentals mr
               WHERE mr.movie_id = m.id AND mr.returned_at IS NULL
             ) THEN 0 ELSE 1 END AS available
      FROM movies m
      WHERE m.active = 1
    `);
    res.json(rows);
  } catch (e) {
    next(e);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const row = await db.get(`
      SELECT m.id, m.title, m.description, m.release_year, m.rental_rate, m.length, m.active,
             CASE WHEN EXISTS (
               SELECT 1
               FROM movie_rentals mr
               WHERE mr.movie_id = m.id AND mr.returned_at IS NULL
             ) THEN 0 ELSE 1 END AS available
      FROM movies m
      WHERE m.id = ?
    `, [id]);
    if (!row) {
      const err = new Error('Película no encontrada');
      err.status = 404;
      return next(err);
    }
    res.json(row);
  } catch (e) {
    next(e);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { title, description, release_year, rental_rate, length } = req.body;
    if (!title) {
      const err = new Error('Título requerido');
      err.status = 400;
      return next(err);
    }
    const result = await db.run('INSERT INTO movies (title, description, release_year, rental_rate, length) VALUES (?, ?, ?, ?, ?)', [title, description || '', release_year || null, rental_rate || null, length || null]);
    logger.info(`Create movie: ${title} by ${req.user.id}`);
    res.status(201).json({ id: result.insertId });
  } catch (e) {
    next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { title, description, release_year, rental_rate, length, active } = req.body;
    const row = await db.get('SELECT id FROM movies WHERE id = ?', [id]);
    if (!row) {
      const err = new Error('Película no encontrada');
      err.status = 404;
      return next(err);
    }
    await db.run('UPDATE movies SET title = ?, description = ?, release_year = ?, rental_rate = ?, length = ?, active = ? WHERE id = ?', [title, description || '', release_year || null, rental_rate || null, length || null, active === '0' ? 0 : 1, id]);
    logger.info(`Update movie:${id} by ${req.user.id}`);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const id = req.params.id;
    const row = await db.get('SELECT id FROM movies WHERE id = ?', [id]);
    if (!row) {
      const err = new Error('Película no encontrada');
      err.status = 404;
      return next(err);
    }
    await db.run('UPDATE movies SET active = 0 WHERE id = ?', [id]);
    logger.info(`Deactivate movie:${id} by ${req.user.id}`);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};

exports.returnMovie = async (req, res, next) => {
  try {
    const id = req.params.id;
    const rentalRow = await db.get(
      'SELECT id FROM movie_rentals WHERE movie_id = ? AND returned_at IS NULL ORDER BY rented_at DESC LIMIT 1',
      [id]
    );

    if (!rentalRow) {
      const err = new Error('No hay un préstamo activo para devolver');
      err.status = 404;
      return next(err);
    }

    await db.run('UPDATE movie_rentals SET returned_at = ? WHERE id = ?', [new Date(), rentalRow.id]);
    logger.info(`Return: film=${id} rental=${rentalRow.id} by ${req.user.id}`);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};

exports.rent = async (req, res, next) => {
  try {
    const id = req.params.id;
    const days = Number(req.body.days || 1);
    const customerId = Number(req.body.customer_id || 1);
    if (days <= 0) {
      const err = new Error('Días inválidos');
      err.status = 400;
      return next(err);
    }
    const movie = await db.get('SELECT id FROM movies WHERE id = ? AND active = 1', [id]);
    if (!movie) {
      const err = new Error('Película no encontrada o inactiva');
      err.status = 404;
      return next(err);
    }

    const activeRentalRow = await db.get(
      'SELECT COUNT(*) AS active_rentals FROM movie_rentals WHERE movie_id = ? AND returned_at IS NULL',
      [id]
    );
    if (activeRentalRow && activeRentalRow.active_rentals > 0) {
      const err = new Error('La película ya está prestada y no puede alquilarse hasta que se devuelva');
      err.status = 400;
      return next(err);
    }

    const now = new Date();
    const dueAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    await db.run('INSERT INTO movie_rentals (movie_id, customer_id, rented_at, due_at, returned_at) VALUES (?, ?, ?, ?, ?)', [id, customerId, now, dueAt, null]);
    logger.info(`Rent: film=${id} days=${days} by ${req.user.id}`);
    res.json({ ok: true, available: 0 });
  } catch (e) {
    next(e);
  }
};
