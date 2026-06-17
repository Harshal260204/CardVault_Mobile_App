import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../auth/auth.types';
import { ImagesService } from './images.service';

@Controller('images')
export class ImagesController {
  constructor(private readonly images: ImagesService) {}

  @Get(':id/url')
  async getUrl(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const result = await this.images.getSignedUrl(user, id);
    return { data: result };
  }
}
