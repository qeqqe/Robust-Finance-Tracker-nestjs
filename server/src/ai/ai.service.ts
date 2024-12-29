import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import fetch from 'node-fetch';
import { Readable } from 'stream';
import { PrismaClient } from '@prisma/client';
import { encode } from 'gpt-3-encoder';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatCompletionRequest {
  messages: Message[];
  model?: string;
  temperature?: number;
  stream?: boolean;
  max_tokens?: number;
}

const prisma = new PrismaClient();

@Injectable()
export class AiService {
  private readonly apiUrl: string;

  constructor(private configService: ConfigService) {
    this.apiUrl = 'http://localhost:1234/v1/chat/completions';
  }

  private countTokens(text: string): number {
    return encode(text).length;
  }

  async createChatSession(userId: string, title: string, aiRole: string) {
    try {
      return await prisma.$transaction(async (tx) => {
        const session = await tx.chatSession.create({
          data: {
            userId,
            title,
            aiRole,
          },
        });

        // Create initial system message
        await tx.chatMessage.create({
          data: {
            sessionId: session.id,
            role: 'system',
            content: this.getRolePrompt(aiRole),
            tokenCount: this.countTokens(this.getRolePrompt(aiRole)),
          },
        });

        return session;
      });
    } catch (error) {
      console.error('Error creating chat session:', error);
      throw new HttpException(
        'Failed to create chat session',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private getRolePrompt(role: string): string {
    const rolePrompts = {
      financialAdvisor: `You are an experienced financial advisor...`,
      // ...other role prompts...
    };
    return rolePrompts[role] || 'I am a helpful finance assistant.';
  }

  async saveChatMessage(sessionId: string, role: string, content: string) {
    const tokenCount = this.countTokens(content);
    return prisma.chatMessage.create({
      data: {
        sessionId,
        role,
        content,
        tokenCount,
      },
    });
  }

  async getChatSessions(userId: string) {
    return prisma.chatSession.findMany({
      where: { userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getSessionTokenCount(sessionId: string): Promise<number> {
    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      select: { tokenCount: true },
    });

    return messages.reduce((sum, message) => sum + message.tokenCount, 0);
  }

  async getSessionMessages(userId: string, sessionId: string) {
    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session) {
      throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
    }

    return session;
  }

  async streamChatCompletion(req: ChatCompletionRequest): Promise<Readable> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...req,
          stream: true,
          model: 'gpt-3.5-turbo',
        }),
      });

      if (!response.ok) {
        throw new HttpException(
          'Failed to communicate with LM Studio',
          HttpStatus.BAD_GATEWAY,
        );
      }

      const outputStream = new Readable({
        read() {}, // Required but noop
      });

      (async () => {
        try {
          const responseBody = response.body;
          if (!responseBody) {
            throw new Error('No response body');
          }

          responseBody.on('data', (chunk) => {
            const text = chunk.toString();
            const lines = text.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(5));
                  if (data.choices?.[0]?.delta?.content) {
                    const formattedData = {
                      content: data.choices[0].delta.content,
                    };
                    outputStream.push(
                      `data: ${JSON.stringify(formattedData)}\n\n`,
                    );
                  }
                } catch (e) {
                  console.error('Error parsing chunk:', e);
                }
              }
            }
          });

          responseBody.on('end', () => {
            outputStream.push(null);
          });

          responseBody.on('error', (error) => {
            console.error('Response body error:', error);
            outputStream.destroy(error);
          });
        } catch (error) {
          console.error('Stream processing error:', error);
          outputStream.destroy(error);
        }
      })();

      return outputStream;
    } catch (error) {
      console.error('AI Service Error:', error);
      throw new HttpException(
        'AI service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async sendMessage(messages: Message[]) {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          model: 'gpt-3.5-turbo', // format compatibility with LM Studio
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new HttpException(
          'Failed to communicate with LM Studio',
          HttpStatus.BAD_GATEWAY,
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('AI Service Error:', error);
      throw new HttpException(
        'AI service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
