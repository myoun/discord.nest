import { Controller } from '@nestjs/common';
import { LAZY_FUNCTION_METADATA } from './discord-handler';

export const DISCORD_CONTROLLER_METADATA = Symbol('DISCORD_CONTROLLER_METADATA');
export const DISCORD_USE_MESSAGE_COMMAND_METADATA = Symbol('DISCORD_MESSAGE_COMMAND_METADATA');

export type DiscordUseMessageCommandMetadata = {
    prefix: string
};

export const DiscordController = (): ClassDecorator => (target: Function) => {
    Reflect.defineMetadata(DISCORD_CONTROLLER_METADATA, true, target);
    Controller()(target);
}

export const UseMessageCommand = (prefix: string): ClassDecorator => {
    return (target: Function) => {
        const metadata: DiscordUseMessageCommandMetadata = {
            prefix
        }
        Reflect.defineMetadata(DISCORD_USE_MESSAGE_COMMAND_METADATA, metadata, target);
    }
}