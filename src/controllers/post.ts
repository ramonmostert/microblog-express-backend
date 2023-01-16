import { RequestHandler } from 'express';
import HttpError from '../models/http-error';
import Post from '../models/post';
import type { PostDocument } from '../models/post';

export const list: RequestHandler = async (req, res, next) => {
  try {
    const [count, posts] = await Promise.all([Post.count(), Post.find().populate('user', 'name').sort({ createdAt: 'desc' })]);

    if (!posts) {
      return next(new HttpError('Fetching games failed', 404));
    }

    const postsResult = posts.map((post) => post.toObject({ getters: true }));
    res.json({ posts: postsResult, count });
  } catch (error) {
    return next(new HttpError((error as Error).message, 500));
  }
};

export const add: RequestHandler<PostDocument> = async (req, res, next) => {
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

  if (!post) return next(new HttpError('Could not add game', 500));
  const populated = await post.populate('user', 'name');
  res.json({ post: populated.toObject({ getters: true }) });
};

export const findById: RequestHandler = async (req, res, next) => {
  const { id } = req.params as { id: string };

  let post;
  try {
    post = await Post.findById(id).populate('user', 'name, _id');
  } catch (error) {
    return next(new HttpError((error as Error).message, 500));
  }

  if (!post) {
    return next(new HttpError('post not found', 401));
  }

  res.json({ post: post.toObject({ getters: true }) });
};

export const update: RequestHandler = async (req, res, next) => {
  const { id, title, content } = req.body as {
    id: string;
    title: string;
    content: string;
  };

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
    updatedPost = await Post.updateOne({ _id: id }, { title, content });
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
