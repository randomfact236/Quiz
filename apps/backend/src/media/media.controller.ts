/**
 * ============================================================================
 * Media Controller
 * ============================================================================
 * Media library endpoints (admin-only). Ported from the affiliate-website
 * project and adapted to this project's JWT/Roles guards.
 * ============================================================================
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Express } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

import { ConversionStats, MediaListResponse, QueryMediaDto, UpdateMediaDto } from './dto/media.dto';
import { Media } from './entities/media.entity';
import { MediaService } from './media.service';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

@ApiTags('Media')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_UPLOAD_BYTES },
    })
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload an image (converted to WebP) (Admin only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        alt: { type: 'string' },
      },
      required: ['file'],
    },
  })
  async upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body('alt') alt?: string
  ): Promise<Media> {
    if (!file) {
      return Promise.reject(new Error('No file provided'));
    }
    return this.mediaService.createFromFile(file, alt);
  }

  @Get()
  @ApiOperation({ summary: 'List media assets (Admin only)' })
  findAll(@Query() query: QueryMediaDto): Promise<MediaListResponse> {
    return this.mediaService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get conversion/storage stats (Admin only)' })
  getStats(): Promise<ConversionStats> {
    return this.mediaService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single media asset (Admin only)' })
  findOne(@Param('id') id: string): Promise<Media> {
    return this.mediaService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update media metadata e.g. alt text (Admin only)' })
  update(@Param('id') id: string, @Body() dto: UpdateMediaDto): Promise<Media> {
    return this.mediaService.updateAlt(id, dto.alt);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a media asset (Admin only)' })
  @ApiParam({ name: 'id' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.mediaService.remove(id);
  }
}
