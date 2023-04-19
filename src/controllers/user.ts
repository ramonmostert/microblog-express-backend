import { RequestHandler, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import fs, { PathLike } from 'fs';
import HttpError from '../models/http-error';
import User from '../models/user';

export const signup: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { password, repeatPassword, name, email } = req.body;

    if (password !== repeatPassword) {
      return next(new HttpError('Passwords do not match', 400));
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({ password: hashedPassword, name, email });

    await user.save();

    if (!user) {
      return next(new HttpError('Signup user failed', 500));
    }

    res.status(201).json({ signup: 'ok', user: user.toResultJSON() });
  } catch (error) {
    return next(new HttpError((error as Error).message, 500));
  }
};

export const login: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  // get user from mongodb
  let user;

  try {
    user = await User.findOne({ email });
  } catch (error) {
    return next(new HttpError((error as Error).message, 500));
  }

  if (!user) {
    return next(new HttpError('User not found', 401));
  }

  let isValidPassword;

  // validate password
  try {
    isValidPassword = await bcrypt.compare(password, user.password);
  } catch (error) {
    return next(new HttpError((error as Error).message, 401));
  }

  if (!isValidPassword) {
    return next(new HttpError('Could not log in user', 401));
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

  res.status(200).json({ user: user.toResultJSON() });
};

export const refresh: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  const { refreshToken } = req.cookies;
  console.log({ refreshToken });
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

    res.status(200).json({ refresh: 'ok', user: user.toResultJSON() });
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

export const me: RequestHandler = async (req, res, next) => {
  try {
    const user = await User.findById(req.userData.id);

    if (!user) {
      throw new Error('user not found');
    }

    res.status(200).json({ user: user.toResultJSON() });
  } catch (error) {
    next(new HttpError((error as Error).message, 401));
  }
};

export const updateAvatar: RequestHandler = async (req, res, next) => {
  try {
    const user = await User.findById(req.userData.id);

    let update;

    if (!req.file) {
      console.log('no file');
      update = await User.updateOne({ _id: req.userData.id }, { avatar: null, updatedAt: new Date().toLocaleString() });

      fs.unlink(user?.avatar as PathLike, (error) => {
        console.log(error);
      });
    } else {
      update = await User.updateOne({ _id: req.userData.id }, { avatar: req.file.path, updatedAt: new Date().toLocaleString() });
    }

    if (!update) {
      throw new Error('update failed');
    }

    const updatedUser = await User.findById(req.userData.id);

    if (!updatedUser) {
      throw new Error('user not found');
    }

    res.status(200).json({ user: updatedUser.toResultJSON() });
  } catch (error) {
    next(new HttpError((error as Error).message, 401));
  }
};
