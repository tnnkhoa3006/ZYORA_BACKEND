import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiOptions, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  private isConfigured = false;

  constructor(private readonly configService: ConfigService) {
    this.configure();
  }

  private configure() {
    if (this.isConfigured) return;
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      // Defer throwing until use to avoid breaking app bootstrap if unused
      return;
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
    this.isConfigured = true;
  }

  async uploadImageFromBuffer(
    fileBuffer: Buffer,
    options?: UploadApiOptions,
  ): Promise<UploadApiResponse> {
    this.configure();
    if (!this.isConfigured) {
      throw new InternalServerErrorException('Cloudinary is not configured');
    }

    const uploadOptions: UploadApiOptions = {
      folder: options?.folder || 'zyora/avatars',
      resource_type: 'image',
      overwrite: true,
      ...options,
    };

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error || !result) {
          return reject(new InternalServerErrorException(error?.message || 'Cloudinary upload failed'));
        }
        resolve(result);
      });

      const readable = new Readable();
      readable.push(fileBuffer);
      readable.push(null);
      readable.pipe(uploadStream);
    });
  }
}


