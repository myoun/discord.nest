import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
} from '@nestjs/common';
import { ApplicationCommandResponse } from './lib/adapter/discord-adapter'
@Catch(HttpException)
export class TransformExceptionMessageFilter implements ExceptionFilter {

    catch(exception: HttpException, host: ArgumentsHost) {
        if (host.getArgByIndex(0).interaction !== undefined) {
            const response: ApplicationCommandResponse = host.getArgByIndex(1);
            response.interaction.reply(exception.message);
        }
    }
}