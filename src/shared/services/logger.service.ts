import { LoggerService } from '@nestjs/common';
import { Logger, QueryRunner } from 'typeorm';
import { LogController } from './../utilities/logController';

export class MyLogger implements LoggerService, Logger {
  logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner) {
    const sql =
      query +
      (parameters && parameters.length
        ? ' -- PARAMETERS: ' + this.stringifyParams(parameters)
        : '');
    // LogController.write('[QUERY]: ' + sql);
  }

  logQueryError(
    error: string,
    query: string,
    parameters?: any[],
    queryRunner?: QueryRunner,
  ) {
    const sql =
      query +
      (parameters && parameters.length
        ? ' -- PARAMETERS: ' + this.stringifyParams(parameters)
        : '');
    LogController.write([`[FAILED QUERY]: ${sql}`, `[QUERY ERROR]: ${error}`]);
  }

  logQuerySlow(
    time: number,
    query: string,
    parameters?: any[],
    queryRunner?: QueryRunner,
  ) {
    const sql =
      query +
      (parameters && parameters.length
        ? ' -- PARAMETERS: ' + this.stringifyParams(parameters)
        : '');
    // LogController.write(`[SLOW QUERY: ${time} ms]: ` + sql);
  }

  logSchemaBuild(message: string, queryRunner?: QueryRunner) {
    // LogController.write(message);
  }

  logMigration(message: string, queryRunner?: QueryRunner) {
    // LogController.write(message);
  }
  log(message: string) {
    // LogController.write(message);
  }
  error(message: string, trace: string) {
    LogController.write([`[MESSAGE]: ${message}`, `[TRACE]: ${trace}`]);
  }
  warn(message: string) {}
  debug(message: string) {}
  verbose(message: string) {}

  protected stringifyParams(parameters: any[]) {
    try {
      return JSON.stringify(parameters);
    } catch (error) {
      // most probably circular objects in parameters
      return parameters;
    }
  }
}
