import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config({ path: './config.env' });
const { app } = await import('./app.js');

const port = process.env.PORT;

mongoose
  .connect(process.env.DATABASE)
  .then(() => console.log('Database Sucsess Connect'))
  .catch((err) => console.error('Initial mongoose connect error:', err));

app.listen(port, () => {
  console.log(`Server Is Running in port ${port}`);
});
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
});

process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
});
