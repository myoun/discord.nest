import { Get, Type } from "@nestjs/common";
import { SlashCommandBuilder } from '@discordjs/builders';
import { DISCORD_USE_MESSAGE_COMMAND_METADATA, DiscordUseMessageCommandMetadata } from "./discord-controller";

export const DISCORD_MESSAGE_COMMAND_METADATA = "DISCORD_MESSAGE_COMMAND_METADATA";
export const DISCORD_APPLICATION_COMMAND_METADATA = "DISCORD_APPLICATION_COMMAND_METADATA";
export const LAZY_FUNCTION_METADATA = Symbol("LAZY_FUNCTION_METADATA");

export type CommandMetadata = MessageCommandMetadata | ApplicationCommandMetdata

export type MessageCommandMetadata = {
  type: 'message',
  command: string,
  prefix: string,
  controller: Function,
}

export type ApplicationCommandMetdata = {
  type: 'application',
  commandBuilder: SlashCommandBuilder,
}

export const MessageCommand = (command: string): MethodDecorator => (
    target: any,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<any>
  ) => {
    const lazy = (useMessageCommandMetadata: DiscordUseMessageCommandMetadata) => {
      
      const metadata: MessageCommandMetadata = { 
        type: "message", 
        command, 
        prefix: useMessageCommandMetadata.prefix, 
        controller: target
      };

      Reflect.defineMetadata(
        DISCORD_MESSAGE_COMMAND_METADATA,
        metadata,
        descriptor.value,
      );
    }

    Reflect.defineMetadata(LAZY_FUNCTION_METADATA, lazy, descriptor.value);

    return Get(`m-${command}`)(target, propertyKey, descriptor);
  };


export const Command = (command: string | Partial<SlashCommandBuilder>): MethodDecorator => (
    target: any,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<any>
  ) => {
    let builder: SlashCommandBuilder;
    if (typeof command === "string") {
      builder = new SlashCommandBuilder();
      builder.setName(command);
      builder.setDescription(`${command} command.`)
    } else {
      if (command.toJSON !== undefined) {
        builder = command as SlashCommandBuilder;
      }
    }

    const metadata: ApplicationCommandMetdata = { type : "application", commandBuilder : builder };
    Reflect.defineMetadata(
      DISCORD_APPLICATION_COMMAND_METADATA,
      metadata,
      descriptor.value,
    );

    return Get(`a-${builder.name}`)(target, propertyKey, descriptor);
  };