import * as dotenv from 'dotenv';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { DiscordAdapter } from './lib/adapter/discord-adapter';
import { GatewayIntentBits } from 'discord.js';

dotenv.config();

async function bootstrap() {

  const app = await NestFactory.create(
    AppModule,
    new DiscordAdapter(AppModule, {
      token: process.env.DISCORD_TOKEN,
      clientId: process.env.DISCORD_CLIENT_ID,
      guildId: process.env.DISCORD_GUILD_ID,
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages]
    }),
  );

  await app.listen(0);
}

bootstrap();
