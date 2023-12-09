import { Injectable, Type } from "@nestjs/common";
import { DISCORD_CONTROLLER_METADATA, DISCORD_USE_MESSAGE_COMMAND_METADATA, DiscordUseMessageCommandMetadata } from "../handler/discord-controller";
import { ApplicationCommandMetdata, CommandMetadata, DISCORD_APPLICATION_COMMAND_METADATA, DISCORD_MESSAGE_COMMAND_METADATA, LAZY_FUNCTION_METADATA, MessageCommandMetadata } from "../handler/discord-handler";

type Module = Type<any>;
export type MetadataMap = Map<string, CommandMetadata>;
export type PrefixMap = Map<string, Array<string>>;

export class CommandHandlerMetadataExplorer {
  explore(module: Module): [MetadataMap, PrefixMap] {
    const result: MetadataMap = new Map();
    const prefixResult: PrefixMap = new Map();

    this.exploreInternal(module, result, prefixResult);
    return [result, prefixResult];
  }

  private exploreInternal(module: Module, map: MetadataMap, pmap: PrefixMap) {
    const imports: Module[] = Reflect.getMetadata('imports', module);

    if (imports !== undefined) {
      imports.forEach((importedModule) =>
        this.exploreInternal(importedModule, map, pmap),
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
      .forEach((controller) => this.exploreController(controller, map, pmap));
  }

  private exploreController(
    controller: Type<any>,
    map: MetadataMap,
    pmap: PrefixMap,
  ) {
    const useMessageCommandMetadata: DiscordUseMessageCommandMetadata | undefined = 
      Reflect.getMetadata(DISCORD_USE_MESSAGE_COMMAND_METADATA, controller);
    
    if (useMessageCommandMetadata) {
      if (!pmap.has(useMessageCommandMetadata.prefix)) {
        pmap.set(useMessageCommandMetadata.prefix, []);
      }
    }

    Object.values(Object.getOwnPropertyDescriptors(controller.prototype))
      .map((descriptor) => Reflect.getMetadata(LAZY_FUNCTION_METADATA, descriptor.value))
      .filter((f) => f !== undefined)
      .forEach((f) => f(useMessageCommandMetadata))

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

                const npmap = pmap.get(metadata.prefix);
                npmap.push(metadata.command);
                pmap.set(metadata.prefix, npmap);
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