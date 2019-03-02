import { Config, LogLevel } from "./utils/settings";

export class ConsoleLogger {
  public static error(message?: any, ...optionalParams: any[]) {
    if (this.shouldLog(LogLevel.Errors)) {
      this.log(console.error, message, optionalParams);
    }
  }

  public static info(message?: any, ...optionalParams: any[]) {
    if (this.shouldLog(LogLevel.Info)) {
      this.log(console.info, message, optionalParams);
    }
  }

  public static debug(message?: any, ...optionalParams: any[]) {
    if (this.shouldLog(LogLevel.Debug)) {
      this.log(console.log, message, optionalParams);
    }
  }

  private static log(
    logFn: typeof console.log,
    message: string,
    optionalParams: any[]
  ) {
    if (optionalParams.length > 0) {
      logFn(message, ...optionalParams);
    } else {
      logFn(message);
    }
  }
  private static shouldLog(minLevel: LogLevel) {
    return Config.getLogLevel() >= minLevel;
  }
}
