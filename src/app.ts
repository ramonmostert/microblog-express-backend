import bodyParser from 'body-parser';
import express, { Request, Response, NextFunction } from 'express';
import postRoutes from './routes/post';
import userRoutes from './routes/user';
import mongoose from 'mongoose';
import HttpError from './models/http-error';
import cors, { CorsOptions } from 'cors';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import path from 'path';
const allowedOrigins = ['http://localhost:5173'];

if (!process.env.MONGODB_URL) {
  throw new Error('Could not find a mongodb url');
}

const app = express();

app.use(bodyParser.json());
app.use(cookieParser());

app.use('/static', express.static(path.join('./static')));

// cors
const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

// set headers
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');

  if ('OPTIONS' === req.method) {
    return res.send(200);
  }

  next();
});

// modules
app.use('/posts', postRoutes);
app.use('/user', userRoutes);

// global error handling
app.use((error: HttpError, req: Request, res: Response, next: NextFunction) => {
  if (req.file) {
    fs.unlink(req.file.path, (err) => {
      console.log(err);
    });
  }
  if (res.headersSent) {
    return next(error);
  }

  res.status(error.statusCode).json({ message: error.message || 'An unknown error occured' });
});

// boot
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => {
    app.listen(process.env.PORT);
    console.log('listening');
  })
  .catch((error) => {
    console.log(error);
  });
