import { LogController } from './logController';

export const operationFailed =
  'Operation failed. Database error. Please report';

export function compose(message) {
  return { udm_message: message };
}

export function formatError(error, message) {
  LogController.write([`[EXCEPTION ERROR]: ${JSON.stringify(error)}`]);
  return error && error.udm_message ? error.udm_message : message;
}
