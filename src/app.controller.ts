import { AppService } from './app.service';
import { Req } from '@nestjs/common';
import { RandomNumberService } from './random-number.service';
import { Command, MessageCommand } from './lib/handler/discord-handler';
import { DiscordController, UseMessageCommand } from './lib/handler/discord-controller';
import { ApplicationCommandRequest, MessageCommandRequest } from './lib/adapter/discord-adapter';
import { SlashCommandBuilder } from 'discord.js';


const sumCommand = new SlashCommandBuilder()
                        .setName("sum")
                        .setDescription("sum two numbers")
                        .addIntegerOption(option => option.setName("first").setDescription("first option"))
                        .addIntegerOption(option => option.setName("second").setDescription("second option"))
                        
@UseMessageCommand(".")
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
    const interaction = request.interaction;
    interaction.reply((interaction.options.getInteger("first", true)+interaction.options.getInteger("second", true)).toString());
  }

  @MessageCommand("hi")
  hiMessageCommand(@Req() request: MessageCommandRequest) {
    console.log("hi")
    const message = request.message;
    message.channel.send("hi");
  }
}
