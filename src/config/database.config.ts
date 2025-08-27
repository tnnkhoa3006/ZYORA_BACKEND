import { Logger } from '@nestjs/common';
import { MongooseModuleOptions } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

const config: MongooseModuleOptions = {
  uri: process.env.MONGO_URI as string,
  connectionFactory: (connection: Connection) => {
    Logger.log('✅ MongoDB Connected!', 'Database');
    return connection;
  },
};

export default config;
