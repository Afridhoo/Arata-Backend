import mongoose from 'mongoose';

export function handleObjMongoose(val) {
  return val?.map((x) => new mongoose.Types.ObjectId(x));
}

export function handleObjMongooseById(val) {
  return val?.map((s) => new mongoose.Types.ObjectId(s._id));
}

export function handleOneObjMongoose(val) {
  return new mongoose.Types.ObjectId(val);
}

