import mongoose, { Schema, model, Model, Document } from 'mongoose';
import { UserDocument } from './user';

export interface PostDocument extends Document {
  title: string;
  content: string;
  user: UserDocument['_id'];
  createdAt: Date;
  updatedAt: Date;
}

export type PostModel = Model<PostDocument>;

const postSchema: Schema = new Schema<PostDocument>({
  title: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date },
  user: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
});

export default model<PostDocument, PostModel>('Post', postSchema);
