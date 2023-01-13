import { model, Schema, Document, Model } from 'mongoose';
import jwt from 'jsonwebtoken';

export interface UserDocument extends Document {
  email: string;
  name: string;
  password: string;
  generateAuthToken: () => string;
  generateRefreshToken: () => string;
}

export type UserModel = Model<UserDocument>;

const userSchema: Schema = new Schema<UserDocument, Model<UserDocument>>({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: { type: String },
});

userSchema.methods.comparePassword = function (password: string): boolean {
  return password === this.password;
};

userSchema.methods.generateAuthToken = function (): string {
  const token = jwt.sign({ id: this._id, email: this.email }, process.env.JWT_SECRET, {
    expiresIn: `${parseInt(process.env.JWT_EXPIRES_IN)}m`,
  });

  return token;
};

userSchema.methods.generateRefreshToken = function (): string {
  const token = jwt.sign({ id: this._id, email: this.email }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: `${parseInt(process.env.JWT_EXPIRES_IN)}m`,
  });

  return token;
};

const User = model<UserDocument, UserModel>('User', userSchema);

export default User;
