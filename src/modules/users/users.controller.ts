import { Body, Controller, Delete, Get, Param, Patch, Req, UseGuards, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly cloudinaryService: CloudinaryService,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    async getMe(@Req() req: any) {
        return this.usersService.findById(req.user.userId);
    }

    @Roles('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Get()
    async getAll() {
        return this.usersService.findAll();
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    async getById(@Param('id') id: string) {
        return this.usersService.findById(id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('me')
    async updateMe(@Req() req, @Body() updateUserDto: UpdateUserDto) {
        return this.usersService.update(req.user.userId, updateUserDto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('me/avatar')
    @UseInterceptors(FileInterceptor('file'))
    async uploadAvatar(
        @Req() req: any,
        @UploadedFile() file?: any,
    ) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        const isImage = /^image\/(jpeg|png|webp|gif)$/.test(file.mimetype);
        const maxSizeBytes = 5 * 1024 * 1024; // 5MB
        if (!isImage) {
            throw new BadRequestException('Invalid file type');
        }
        if (file.size > maxSizeBytes) {
            throw new BadRequestException('File too large');
        }

        const result = await this.cloudinaryService.uploadImageFromBuffer(file.buffer, {
            folder: 'zyora/avatars',
            public_id: req.user.userId,
            overwrite: true,
            transformation: [{ width: 512, height: 512, crop: 'fill', gravity: 'auto' }],
        });

        const updated = await this.usersService.update(req.user.userId, { avatarUrl: result.secure_url });
        return { success: true, avatarUrl: result.secure_url, user: updated };
    }

    @Roles('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Delete(':id')
    async deleteUser(@Param('id') id: string) {
        return this.usersService.delete(id);
    }
}
