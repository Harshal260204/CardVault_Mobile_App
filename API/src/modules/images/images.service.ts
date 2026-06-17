import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { RequestUser } from '../auth/auth.types';
import { StorageService } from '../../storage/storage.service';

@Injectable()
export class ImagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async getSignedUrl(user: RequestUser, imageId: string) {
    const image = await this.prisma.cardImage.findFirst({
      where: { id: imageId, organizationId: user.organizationId },
    });
    if (!image) {
      throw new NotFoundException('Image not found');
    }
    const url = await this.storage.getSignedUrl(image.storagePath);
    if (!url) {
      throw new NotFoundException('Unable to generate image URL');
    }
    return { url, expiresIn: 3600 };
  }
}
