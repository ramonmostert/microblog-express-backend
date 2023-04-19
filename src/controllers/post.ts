import { RequestHandler } from 'express';
import HttpError from '../models/http-error';
import Post from '../models/post';
import { validationResult } from 'express-validator';

export const list: RequestHandler = async (req, res, next) => {
  try {
    const [count, posts] = await Promise.all([Post.count(), Post.find().populate('user', ['avatar', 'name']).sort({ createdAt: 'desc' })]);

    if (!posts) {
      return next(new HttpError('Fetching games failed', 404));
    }

    const postsResult = posts.map((post) => post.toResultJSON());
    res.json({ posts: postsResult, count });
  } catch (error) {
    return next(new HttpError((error as Error).message, 500));
  }
};

export const add: RequestHandler = async (req, res, next) => {
  const validation = validationResult(req);

  if (!validation.isEmpty()) {
    return res.status(422).json({ errors: validation.array() });
  }

  const { title, content } = req.body;

  const post = new Post({
    title,
    content,
    user: req.userData.id,
    createdAt: new Date().toLocaleString(),
  });

  try {
    await post.save();
  } catch (error) {
    return next(new HttpError((error as Error).message, 500));
  }

  if (!post) return next(new HttpError('Failed adding post', 500));
  const populated = await post.populate('user', ['name', 'avatar']);
  res.json({ post: populated.toObject({ getters: true }) });
};

export const findById: RequestHandler = async (req, res, next) => {
  const { id } = req.params;

  let post;
  try {
    post = await Post.findById(id).populate('user', 'name, _id').populate('user', ['avatar', 'name']);
  } catch (error) {
    return next(new HttpError((error as Error).message, 500));
  }

  if (!post) {
    return next(new HttpError('post not found', 401));
  }

  res.json({ post: post.toObject({ getters: true }) });
};

export const update: RequestHandler = async (req, res, next) => {
  const validation = validationResult(req);

  if (!validation.isEmpty()) {
    return res.status(422).json({ errors: validation.array() });
  }

  const { id } = req.params;
  const { title, content } = req.body;

  let post;

  try {
    post = await Post.findById(id).populate('user', 'id');
  } catch (error) {
    return next(new HttpError('Post not found', 401));
  }

  if (!post) {
    return next(new HttpError("couldn't find post", 401));
  }

  if (post.user.id !== req.userData.id) {
    return next(new HttpError("You're not authorized to update this post", 401));
  }

  let updatedPost;

  try {
    updatedPost = await Post.updateOne({ _id: id }, { title, content, updatedAt: new Date().toLocaleString() });
  } catch (error) {
    return next(new HttpError((error as Error).message, 500));
  }

  res.json({ post: updatedPost });
};

export const remove: RequestHandler = async (req, res, next) => {
  const { id } = req.body as { id: string };

  try {
    const post = await Post.findById(id).remove();
    res.json({ post });
  } catch (error) {
    return next(new HttpError((error as Error).message, 500));
  }
};
