import { Controller, Post, Get, Delete, Patch, Body, Param, UseInterceptors, UploadedFile, Req, UseGuards, Res, NotFoundException, BadRequestException, HttpCode, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import type { Request, Response } from 'express';
import { AttachmentsService } from './attachments.service';
import { AuthGuard } from '../boards/guards/auth.guard';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

@ApiTags('attachments')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller()
export class AttachmentsController {
    constructor(private readonly attachmentsService: AttachmentsService) { }

    @ApiOperation({ summary: 'Add an attachment to a card' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @ApiResponse({ status: 201, description: 'File uploaded' })
    @Post('cards/:cardId/attachments')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './uploads/attachments',
                filename: (req, file, cb) => {
                    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
                    cb(null, uniqueName);
                },
            }),
            limits: {
                fileSize: 10 * 1024 * 1024, // 10MB
            },
            fileFilter: (req, file, cb) => {
                const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/zip', 'text/plain'];
                if (allowedMimeTypes.includes(file.mimetype)) {
                    cb(null, true);
                } else {
                    cb(new BadRequestException('Invalid file type'), false);
                }
            },
        }),
    )
    async uploadAttachment(
        @Param('cardId') cardId: string,
        @UploadedFile() file: any,
        @Req() req: Request,
    ) {
        if (!file) throw new BadRequestException('File is required');
        const userId = (req as any).user.userId;

        const metadata = {
            filename: file.filename,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: file.path,
        };

        return this.attachmentsService.createAttachment(cardId, userId, metadata);
    }

    @ApiOperation({ summary: 'List all attachments for a card' })
    @ApiResponse({ status: 200, description: 'Returned attachments' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @Get('cards/:cardId/attachments')
    getAttachments(@Param('cardId') cardId: string, @Req() req: Request) {
        const userId = (req as any).user.userId;
        return this.attachmentsService.findByCardId(cardId, userId);
    }

    @ApiOperation({ summary: 'Download/View an attachment' })
    @ApiResponse({ status: 200, description: 'File stream' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @Get('attachments/:attachmentId')
    async downloadAttachment(
        @Param('attachmentId') attachmentId: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const userId = (req as any).user.userId;
        const attachment = await this.attachmentsService.findById(attachmentId, userId);

        const filePath = path.join(process.cwd(), attachment.path);
        if (!fs.existsSync(filePath)) {
            throw new NotFoundException('File not found on disk');
        }

        res.sendFile(filePath);
    }

    @ApiOperation({ summary: 'Update attachment metadata (rename)' })
    @ApiResponse({ status: 200, description: 'Attachment updated' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @HttpCode(HttpStatus.OK)
    @Patch('attachments/:attachmentId')
    async updateAttachment(
        @Param('attachmentId') attachmentId: string,
        @Req() req: Request,
        @Body() body: { originalname: string }
    ) {
        const userId = (req as any).user.userId;
        return this.attachmentsService.updateAttachment(attachmentId, userId, body.originalname);
    }

    @ApiOperation({ summary: 'Delete an attachment' })
    @ApiResponse({ status: 204, description: 'Attachment deleted' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @Delete('attachments/:attachmentId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteAttachment(@Param('attachmentId') attachmentId: string, @Req() req: Request) {
        const userId = (req as any).user.userId;
        await this.attachmentsService.deleteAttachment(attachmentId, userId);
    }
}
