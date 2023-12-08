import { Injectable, Type } from "@nestjs/common";
import { DISCORD_CONTROLLER_METADATA } from "../handler/discord-controller";
import { ApplicationCommandMetdata, CommandMetadata, DISCORD_APPLICATION_COMMAND_METADATA, MessageCommandMetadata } from "../handler/discord-handler";
import { SlashCommandBuilder } from "@discordjs/builders";
import { DiscoveryService } from "@nestjs/core";

type Module = Type<any>;
export type MetadataMap = Map<string, CommandMetadata>;

// @Injectable()
// export class CommandHandlerMetadataExplorer {

//   constructor(
//     private readonly discoveryService: DiscoveryService,
//   ) {}

//   find(metadataKey: string | symbol) {
//     const providers = this.discoveryService.getProviders();

//     return providers
//       .filter((wrapper) => wrapper.isDependencyTreeStatic())
//       .filter(({ metatype, instance }) => {
//         if (!instance || !metatype) {
//           return false;
//         }
//         return Reflect.getMetadata(metadataKey, metatype);
//       })
//       .map(({ instance }) => instance);
//   }

// }

export class CommandHandlerMetadataExplorer {
  explore(module: Module): MetadataMap {
    const result: MetadataMap = new Map();

    this.exploreInternal(module, result);
    return result;
  }

  private exploreInternal(module: Module, map: MetadataMap) {
    const imports: Module[] = Reflect.getMetadata('imports', module);

    if (imports !== undefined) {
      imports.forEach((importedModule) =>
        this.exploreInternal(importedModule, map),
      );
    }

    const controllers = Reflect.getMetadata('controllers', module);
    if (
      !controllers ||
      !Array.isArray(controllers) ||
      controllers.length === 0
    ) {
      return;
    }

    controllers
      .filter((controller) => this.isDiscordController(controller))
      .forEach((controller) => this.exploreController(controller, map));
  }

  private exploreController(
    controller: Type<any>,
    map: MetadataMap,
  ) {
    Object.values(Object.getOwnPropertyDescriptors(controller.prototype))
        .map((descriptor) => 
          Reflect.getMetadata(DISCORD_APPLICATION_COMMAND_METADATA, descriptor.value)
        ).filter((metadata) => metadata !== undefined)
        .forEach((metadata) => {
            if (this.isApplicationCommand(metadata)) {
                const name = `a-${metadata.commandBuilder.name}`;
                map.set(name, metadata);
            } else if (this.isMessageCommand(metadata)) {
                const name = `m-${metadata.command}`;
                map.set(name, metadata);
            }
        })
  }

  private isDiscordController(controller: Type<any>): boolean {
    return !!Reflect.getMetadata(DISCORD_CONTROLLER_METADATA, controller);
  }

  private isApplicationCommand(metadata: CommandMetadata): metadata is ApplicationCommandMetdata {
    return metadata.type === "application";
  }
  
  private isMessageCommand(metadata: CommandMetadata): metadata is MessageCommandMetadata {
    return metadata.type === "message";
  }
}