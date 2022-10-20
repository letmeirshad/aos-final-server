import { HttpStatus } from '@nestjs/common';
import { Response } from 'express';

export class ResponseMessage {
  statusCode: HttpStatus;
  statusMessage: Responses;
  message: string;
  data?: any;
}

export enum Responses {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export enum Messages {
  success_save = 'Saved Successfully',
  success_found = 'Found Successfully',
  success = 'Successfull',
  fail = 'Failed',
  authentication_successful = 'Successfully Authenticated',
  authentication_unsuccessful = 'Invalid Credentials',
}

export function wsSaved(data?) {
  let res: any = {
    statusCode: HttpStatus.CREATED,
    statusMessage: Responses.SUCCESS,
    message: Messages.success_save,
  };

  if (data) {
    res.data = data;
  }

  return res;
}

export function saved(response: Response, data?) {
  let res: ResponseMessage = {
    statusCode: HttpStatus.CREATED,
    statusMessage: Responses.SUCCESS,
    message: Messages.success_save,
  };

  if (data) {
    res.data = data;
  }

  return response.status(HttpStatus.CREATED).json(res);
}

export function wsFound(data) {
  let res = {
    statusCode: HttpStatus.OK,
    statusMessage: Responses.SUCCESS,
    message: Messages.success_found,
    data: data,
  };

  return res;
}

export function found(response: Response, data) {
  let res: ResponseMessage = {
    statusCode: HttpStatus.OK,
    statusMessage: Responses.SUCCESS,
    message: Messages.success_found,
    data: data,
  };
  return response.status(HttpStatus.OK).json(res);
}

export function success(response: Response, message?, data?) {
  let res: ResponseMessage = {
    statusCode: HttpStatus.OK,
    statusMessage: Responses.SUCCESS,
    message: message ? message : Messages.success,
  };
  if (data) {
    res.data = data;
  }
  return response.status(HttpStatus.OK).json(res);
}

export function authenticated(response: Response, data) {
  let res: ResponseMessage = {
    statusCode: HttpStatus.ACCEPTED,
    statusMessage: Responses.SUCCESS,
    message: Messages.authentication_successful,
    data: data,
  };

  return response.status(HttpStatus.ACCEPTED).json(res);
}

export function invalidAuthentication(response: Response) {
  let res: ResponseMessage = {
    statusCode: HttpStatus.UNAUTHORIZED,
    statusMessage: Responses.FAILED,
    message: Messages.authentication_unsuccessful,
  };

  return response.status(HttpStatus.UNAUTHORIZED).json(res);
}
