import { AppService } from './app.service';
import { SomeGuard } from './app.guard';
import { Req, UseGuards } from '@nestjs/common';
import { Sender } from './sender.decorator';
import { RandomNumberService } from './random-number.service';
import { Command } from './lib/handler/discord-handler';
import { DiscordController } from './lib/handler/discord-controller';
import { ApplicationCommandRequest } from './lib/adapter/discord-adapter';
import { SlashCommandBuilder } from 'discord.js';
import { request } from 'http';


const sumCommand = new SlashCommandBuilder()
                        .setName("sum")
                        .setDescription("sum two numbers")
                        .addIntegerOption(option => option.setName("first").setDescription("first option"))
                        .addIntegerOption(option => option.setName("seconnd").setDescription("second option"))
                        

@DiscordController()
export class AppController {

  

  constructor(
    private readonly appService: AppService,
    private readonly randomNumberService: RandomNumberService,
  ) {}


  @Command("hello")
  helloCommand(@Req() request: ApplicationCommandRequest) {
    const interaction = request.interaction;
    interaction.reply(this.appService.getHello(request.user.displayName));
  }

  @Command("random")
  randomCommand(@Req() request: ApplicationCommandRequest) {
    const interaction = request.interaction;
    interaction.reply(this.randomNumberService.generateRandomNumber().toString());
  }

  @Command(sumCommand)
  sumCommand(@Req() request: ApplicationCommandRequest) {

  }
}
