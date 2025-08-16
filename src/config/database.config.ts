import { Logger } from '@nestjs/common';
import { MongooseModuleOptions } from '@nestjs/mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

const config: MongooseModuleOptions = {
  uri: process.env.MONGO_URI,
  connectionFactory: (connection) => {
    Logger.log('✅ MongoDB Connected!', 'Database');
    return connection;
  },
};

export default config;
