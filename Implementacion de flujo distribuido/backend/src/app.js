const express = require('express');
const morgan = require('morgan');
const path = require('path');

const passport = require('./services/passport');
const authRoutes = require('./routes/auth');
const moviesRoutes = require('./routes/movies');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', '..', 'frontend', 'public')));
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));
app.use(passport.initialize());

app.use('/auth', authRoutes);
app.use('/movies', moviesRoutes);
app.use(errorHandler);

module.exports = app;
