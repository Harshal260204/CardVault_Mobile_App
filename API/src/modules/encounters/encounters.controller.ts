import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../auth/auth.types';
import { UpdateEncounterDto } from './dto/update-encounter.dto';
import { EncountersService } from './encounters.service';

@Controller()
export class EncountersController {
  constructor(private readonly encounters: EncountersService) {}

  @Get('contacts/:contactId/encounters')
  async listForContact(
    @CurrentUser() user: RequestUser,
    @Param('contactId', ParseUUIDPipe) contactId: string,
  ) {
    const items = await this.encounters.listForContact(user, contactId);
    return { data: items };
  }

  @Patch('encounters/:id')
  async update(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEncounterDto,
  ) {
    const encounter = await this.encounters.update(user, id, dto);
    return { data: encounter };
  }
}
