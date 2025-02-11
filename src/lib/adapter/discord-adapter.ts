import { Client, ClientOptions, Routes, Events, ApplicationCommand, User, ChatInputCommandInteraction, Message } from 'discord.js';
import { REST } from "@discordjs/rest";
import { EmptyAdapter } from './empty.adapter';
import { CommandHandlerMetadataExplorer, MetadataMap, PrefixMap } from '../explorer/handler-explorer';
import { RequestHandler, Type } from '@nestjs/common/interfaces';
import { ApplicationCommandMetdata } from '../handler/discord-handler';

type ListenFnCallback = (...args: unknown[]) => void;


export type DiscordBotConfig = ClientOptions & {
    token: string;
    clientId: string;
    guildId?: string;
}

export type ApplicationCommandRequest = {
  interaction: ChatInputCommandInteraction,
  commandName: string,
  command: ApplicationCommand<{}>,
  user: User
}

export type ApplicationCommandResponse = {
  interaction: ChatInputCommandInteraction
}

export type MessageCommandRequest = {
  message: Message,
  commandName: string,
  user: User,
}

export class DiscordAdapter extends EmptyAdapter {
    private readonly discordClient: Client;
    private readonly discordRestClient: REST;
    private readonly config: DiscordBotConfig;

    private readonly metadataMap: MetadataMap;
    private readonly prefixMap: PrefixMap;
    private readonly handlers: Record<string, RequestHandler>;

    constructor(module: Type<any>, config: DiscordBotConfig) {
        super('discord');

        this.config = config;
        this.discordClient = new Client(config);
        this.discordRestClient = new REST().setToken(config.token);
        
        const explorer = new CommandHandlerMetadataExplorer();
        const result = explorer.explore(module);
        this.metadataMap = result[0];
        this.prefixMap = result[1];
        this.handlers = {};
    }

    get(handler: RequestHandler): void;
    get(path: any, handler: RequestHandler): void;
    get(rawPath: unknown, rawHandler?: unknown): void {
      if (!rawHandler) return;

      const path = rawPath as string;
      const handler = rawHandler as RequestHandler;
      const command = this.removeLeadingSlash(path);

      this.handlers[command] = handler;
    };

    async initDiscordClient(): Promise<void> {
      this.discordClient.login(this.config.token);
      const guildId = this.config.guildId;
      const clientId = this.config.clientId;

      this.discordClient.on(Events.InteractionCreate, async interaction => {
        if (!interaction.isChatInputCommand()) return;

        const searchName = `a-${interaction.commandName}`;

        const handler = this.handlers[searchName];
        if (!handler) {
          return;
        }

        const request: ApplicationCommandRequest = {
          interaction: interaction,
          commandName: interaction.commandName,
          command: interaction.command,
          user: interaction.user
        };

        const next = () => {};
        await handler(request, {}, next);
      })

      this.discordClient.on(Events.MessageCreate, async message => {
        const handlersToRun: RequestHandler[] = [];

        this.prefixMap.forEach((commands, prefix) => {
          if (message.content.startsWith(prefix)) {
            const command = message.content.replace(prefix, "").split(" ").at(0)

            const handler = this.handlers[`m-${command}`];

            if (!handler) return;

            const request: MessageCommandRequest = {
              message,
              commandName: command,
              user: message.author
            };

            const next = () => {};
            handlersToRun.push(handler(request, {}, next));
          }
        });

        await Promise.all(handlersToRun);
      })
      try {
        await Promise.all([
          this.discordRestClient.put(
            guildId
              ? Routes.applicationGuildCommands(clientId, guildId)
              : Routes.applicationCommands(clientId),
            {
              body: Array.from(this.metadataMap.values())
                .filter((metadata) => metadata.type === "application")
                .map((metadata) => ((metadata as ApplicationCommandMetdata).commandBuilder.toJSON()))
            },
          ),
          this.discordClient.login(this.config.token)
        ]);
      } catch (err: any) {
        if (err.validator !== undefined) {
          throw Error("There is no description in command.")
        }
      }

    }
    
    listen(port: string | number, callback?: () => void): any;
    listen(port: string | number, hostname: string, callback?: () => void): any;
    listen(
      port: unknown,
      hostname?: ListenFnCallback | string,
      rawCallback?: ListenFnCallback,
    ): any {
      let callback: ListenFnCallback = () => {};
      
      if (typeof hostname === 'function') {
        callback = hostname;
      } else if (typeof rawCallback === 'function') {
        callback = rawCallback;
      }
      
      this.initDiscordClient()
        .then(() => callback())
        .catch((e) => callback(e));
    }

    private removeLeadingSlash(path: string): string {
      return path[0] === '/' ? path.substring(1) : path;
    }

}