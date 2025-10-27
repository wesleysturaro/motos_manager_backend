import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { MotorcyclesService } from './motorcycles.service';
import { CreateMotorcycleDto } from './dto/create-motorcycle.dto';
import { UpdateMotorcycleDto } from './dto/update-motorcycle.dto';
import { FilterMotorcyclesDto } from './dto/filter-motorcycles.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import type { UploadedFile } from './types/uploaded-file.type';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { AddMotorcyclePhotosDto } from './dto/add-motorcycle-photos.dto';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';

const photoStorage = diskStorage({
  destination: (req, _file, cb) => {
    const id = req.params?.id ?? 'general';
    const dest = join(process.cwd(), 'uploads', 'motorcycles', id);
    mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${extname(file.originalname)}`);
  },
});

@Controller('motorcycles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MotorcyclesController {
  constructor(private readonly motorcyclesService: MotorcyclesService) {}

  @Get()
  @Roles('admin', 'viewer')
  findAll(@Query() filters: FilterMotorcyclesDto) {
    return this.motorcyclesService.findAll(filters);
  }

  @Get(':id')
  @Roles('admin', 'viewer')
  findOne(@Param('id') id: string) {
    return this.motorcyclesService.findOne(id);
  }

  @Post()
  @Roles('admin')
  create(@Body() dto: CreateMotorcycleDto, @CurrentUser() user: AuthenticatedUser) {
    return this.motorcyclesService.create(dto, user.id);
  }

  @Put(':id')
  @Roles('admin')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMotorcycleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.motorcyclesService.update(id, dto, user.id);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.motorcyclesService.remove(id);
  }

  @Post(':id/photos')
  @Roles('admin')
  @UseInterceptors(FilesInterceptor('photos', 10, { storage: photoStorage }))
  addPhotos(
    @Param('id') id: string,
    @UploadedFiles() files: UploadedFile[],
    @Body() body: AddMotorcyclePhotosDto,
  ) {
    return this.motorcyclesService.addPhotos(id, files, body);
  }

  @Delete(':id/photos/:photoId')
  @Roles('admin')
  removePhoto(@Param('id') id: string, @Param('photoId') photoId: string) {
    return this.motorcyclesService.removePhoto(id, photoId);
  }
}
