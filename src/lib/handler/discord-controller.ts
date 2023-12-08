import { Controller } from '@nestjs/common';

export const DISCORD_CONTROLLER_METADATA = 'DISCORD_CONTROLLER_METADATA';
export const DISCORD_MESSAGE_COMMAND_METADATA = 'DISCORD_MESSAGE_COMMAND_METADATA';

export const DiscordController = (): ClassDecorator => (target: Function) => {
    Reflect.defineMetadata(DISCORD_CONTROLLER_METADATA, true, target);
    Controller()(target);
}

export const UseMessageCommand = (prefix: string): ClassDecorator => (target: Function) => {
    Reflect.defineMetadata(DISCORD_MESSAGE_COMMAND_METADATA, true, target);
}