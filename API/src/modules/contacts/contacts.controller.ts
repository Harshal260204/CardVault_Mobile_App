import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../auth/auth.types';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { ListContactsQueryDto } from './dto/list-contacts-query.dto';
import { MergeContactDto } from './dto/merge-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  async list(
    @CurrentUser() user: RequestUser,
    @Query() query: ListContactsQueryDto,
  ) {
    const result = await this.contactsService.list(user, query);
    return {
      data: result.items,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
      },
    };
  }

  @Get('search')
  async search(@CurrentUser() user: RequestUser, @Query('q') q: string) {
    const items = await this.contactsService.search(user, q ?? '');
    return { data: items };
  }

  @Get(':id')
  async getOne(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const contact = await this.contactsService.getById(user, id);
    return { data: contact };
  }

  @Post()
  async create(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateContactDto,
  ) {
    const contact = await this.contactsService.create(user, dto);
    return { data: contact };
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContactDto,
  ) {
    const contact = await this.contactsService.update(user, id, dto);
    return { data: contact };
  }

  @Post(':id/merge')
  async merge(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) targetId: string,
    @Body() dto: MergeContactDto,
  ) {
    const contact = await this.contactsService.merge(
      user,
      targetId,
      dto.sourceContactId,
    );
    return { data: contact };
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const result = await this.contactsService.remove(user, id);
    return { data: result };
  }
}
