/**
 * Konfigurasi aplikasi Express: keamanan, parsing, routing, dan error handling.
 */
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const hpp = require('hpp');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const env = require('./config/env');
const routes = require('./routes');
const sanitize = require('./middlewares/sanitize');
const { apiLimiter } = require('./middlewares/rateLimiter');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

const app = express();

app.disable('x-powered-by');
if (env.trustProxy) app.set('trust proxy', env.trustProxy);

app.use(helmet());
app.use(cors({
  origin(origin, cb) {
    // Request tanpa Origin (server-to-server, Postman) tetap diizinkan
    if (!origin || env.corsOrigins.includes(origin)) return cb(null, true);
    return cb(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
}));
app.use(compression());

// Batas ukuran payload (SOP poin 4: ±10 KB per request)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb', parameterLimit: 100 }));
app.use(cookieParser());
app.use(hpp());
app.use(sanitize);

if (!env.isTest) app.use(morgan(env.isProduction ? 'combined' : 'dev'));

// Semua endpoint berada di bawah API_BASE_PATH (configurable, aman di subdirectory)
app.use(env.apiBasePath || '/', apiLimiter, routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
