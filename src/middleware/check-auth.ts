import { RequestHandler, Request } from 'express';
import HttpError from '../models/http-error';
import jwt from 'jsonwebtoken';

const checkAuth: RequestHandler = (req: Request, res, next) => {
  const { authToken } = req.cookies;

  if (!authToken) 
    return next(new HttpError("Couldn't find authorization token", 401));
  }

  try {
    const decodedToken = jwt.verify(authToken, process.env.JWT_SECRET) as JwtPayload;

    req.userData = decodedToken;
    next();
  } catch (error) {
    res.clearCookie('authToken');
    next(new HttpError((error as Error).message, 401));
  }
};

export default checkAuth;
