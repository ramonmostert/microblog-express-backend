import { RequestHandler, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import HttpError from '../models/http-error';
import User from '../models/user';

export const signup: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  const { password, repeatPassword, name, email } = req.body;

  if (password !== repeatPassword) {
    return next(new HttpError('Passwords do not match', 500));
  }

  let hashedPassword;

  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (error) {
    return next(new HttpError((error as Error).message, 500));
  }

  let user;

  try {
    user = new User({ password: hashedPassword, name, email });
    await user.save();
  } catch (error) {
    return next(new HttpError((error as Error).message, 500));
  }

  if (!user) {
    return next(new HttpError('Create user failed', 404));
  }

  const token = user.generateAuthToken();

  res.json({ user: { id: user.id, email: user.email }, token });
};

export const login: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  // get user from mongodb
  let user;

  try {
    user = await User.findOne({ email }).exec();
  } catch (error) {
    return next(new HttpError((error as Error).message, 500));
  }

  if (!user) {
    return next(new HttpError('User not found', 404));
  }

  let isValidPassword;

  // validate password
  try {
    isValidPassword = await bcrypt.compare(password, user.password);
  } catch (error) {
    return next(new HttpError((error as Error).message, 404));
  }

  if (!isValidPassword) {
    return next(new HttpError('Could not log in user', 404));
  }

  // generate token
  const token = user.generateAuthToken();

  res.cookie('authToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' || false,
    maxAge: parseInt(process.env.JWT_EXPIRES_IN) * 60 * 1000,
  });

  const refreshToken = user.generateRefreshToken();

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' || false,
    maxAge: parseInt(process.env.JWT_REFRESH_EXPIRES_IN) * 60 * 1000,
  });

  res.status(200).json({ user: { email: user.email, id: user.id } });
};

// export const status = async () => {};

export const refresh: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return next(new HttpError('Unauthorized', 401));
  }

  try {
    const decodedToken = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET) as JwtPayload;

    const user = await User.findOne({ email: decodedToken.email }).exec();

    if (!user) {
      throw new Error('user not found');
    }

    const token = user.generateAuthToken();

    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: parseInt(process.env.JWT_EXPIRES_IN) * 60 * 1000,
    });

    const newRefreshToken = user.generateRefreshToken();

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: parseInt(process.env.JWT_REFRESH_EXPIRES_IN) * 60 * 1000,
    });

    res.status(200).json({ refresh: 'ok', user: { id: user._id, email: user.email } });
  } catch (error) {
    res.clearCookie('refreshTOken');
    next(new HttpError((error as Error).message, 401));
  }
};

export const signout: RequestHandler = async (req: Request, res: Response) => {
  res.clearCookie('authToken');
  res.clearCookie('refreshToken');
  res.status(200).json({ signout: 'ok' });
};
