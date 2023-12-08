import { Get } from "@nestjs/common";
import { SlashCommandBuilder } from '@discordjs/builders';

export const DISCORD_MESSAGE_COMMAND_METADATA = "DISCORD_MESSAGE_COMMAND_METADATA";
export const DISCORD_APPLICATION_COMMAND_METADATA = "DISCORD_APPLICATION_COMMAND_METADATA";

export type CommandMetadata = MessageCommandMetadata | ApplicationCommandMetdata

export type MessageCommandMetadata = {
  type: 'message',
  command: string
}

export type ApplicationCommandMetdata = {
  type: 'application',
  commandBuilder: SlashCommandBuilder
}

export const MessageCommand = (command: string): MethodDecorator => (
    target: any,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<any>
  ) => {
    const metadata: MessageCommandMetadata = { type: "message", command };
    Reflect.defineMetadata(
      DISCORD_MESSAGE_COMMAND_METADATA,
      metadata,
      descriptor.value,
    );

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