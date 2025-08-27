import { Module } from "@nestjs/common";
import { User, UserSchema } from "./schemas/user.schema";
import { MongooseModule } from "@nestjs/mongoose";
import { UsersService } from "./users.service";
import { UsersController } from './users.controller';
import { CloudinaryModule } from "../cloudinary/cloudinary.module";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    CloudinaryModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})

export class UsersModule {}