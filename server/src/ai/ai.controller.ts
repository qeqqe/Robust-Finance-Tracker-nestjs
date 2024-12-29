import {
  Controller,
  Post,
  Body,
  UseGuards,
  Res,
  HttpStatus,
  Get,
  Request,
  Param,
} from '@nestjs/common';
import { Response } from 'express';
import { AiService } from './ai.service';
import { JwtGuard } from '../auth/guard/jwt.guard';
import { Readable } from 'stream';

@Controller('ai')
@UseGuards(JwtGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('sessions')
  async getChatSessions(@Request() req) {
    return this.aiService.getChatSessions(req.user.id);
  }

  @Get('sessions/:id')
  async getSessionMessages(@Request() req, @Param('id') sessionId: string) {
    return this.aiService.getSessionMessages(req.user.id, sessionId);
  }

  @Post('sessions')
  async createSession(
    @Request() req,
    @Body() body: { title: string; aiRole: string },
  ) {
    return this.aiService.createChatSession(
      req.user.id,
      body.title,
      body.aiRole,
    );
  }

  @Post('chat')
  async chat(@Request() req, @Body() body: any, @Res() res: Response) {
    try {
      // Save user message
      const sessionId = body.sessionId;
      await this.aiService.saveChatMessage(
        sessionId,
        'user',
        body.messages[body.messages.length - 1].content,
      );

      // Check token limit
      const totalTokens = await this.aiService.getSessionTokenCount(sessionId);
      if (totalTokens > 4000) {
        throw new Error(
          'Token limit exceeded for this chat. Please start a new chat.',
        );
      }

      let aiResponse = '';
      const stream: Readable = await this.aiService.streamChatCompletion(body);

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Collect AI response while streaming
      stream.on('data', (chunk) => {
        const lines = chunk.toString().split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ') && !line.includes('[DONE]')) {
            try {
              const data = JSON.parse(line.slice(5));
              if (data.content) {
                aiResponse += data.content;
              }
            } catch (e) {
              console.error('Error parsing chunk:', e);
            }
          }
        }
      });

      // Save AI response when stream ends
      stream.on('end', async () => {
        if (aiResponse) {
          await this.aiService.saveChatMessage(
            sessionId,
            'assistant',
            aiResponse.trim(),
          );
        }
      });

      stream.pipe(res);

      stream.on('error', (error) => {
        console.error('Stream error:', error);
        if (!res.headersSent) {
          res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            message: 'Stream error occurred',
          });
        }
        stream.destroy();
      });
    } catch (error) {
      console.error('Chat error:', error);
      if (!res.headersSent) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          message: error.message || 'Failed to process chat request',
        });
      }
    }
  }

  @Post('message')
  async sendMessage(@Body() body: { messages: any[] }) {
    return this.aiService.sendMessage(body.messages);
  }
}
