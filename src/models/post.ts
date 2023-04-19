import mongoose, { Schema, model, Model, Document } from 'mongoose';
import { UserDocument } from './user';

export interface PostDocument extends Document {
  title: string;
  content: string;
  user: UserDocument['_id'];
  createdAt: Date;
  updatedAt: Date;
  toResultJSON: () => PostResultJSON;
}

interface PostResultJSON {
  id: string;
  title: string;
  content: string;
  user: { avatar: string; id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export type PostModel = Model<PostDocument>;

const postSchema: Schema = new Schema<PostDocument>(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    user: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
  },
  { timestamps: true },
);

postSchema.methods.toResultJSON = function (): PostResultJSON {
  return {
    id: this._id,
    content: this.content,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    title: this.title,
    user: {
      id: this.user._id,
      name: this.user.name,
      avatar: this.user.avatar,
    },
  };
};
export default model<PostDocument, PostModel>('Post', postSchema);
