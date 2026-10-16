import { EventService } from './event.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';

export class EventController {
  static list = async (req, res) => {
    const result = await EventService.list(req.query);
    return ApiResponse.success(res, result.data, result.meta);
  };

  static getById = async (req, res) => {
    const event = await EventService.getById(req.params.id);
    return ApiResponse.success(res, event);
  };

  static create = async (req, res) => {
    const event = await EventService.create(req.body, req.user);
    return ApiResponse.success(res, event, null, [], 201);
  };

  static update = async (req, res) => {
    const event = await EventService.update(req.params.id, req.body);
    return ApiResponse.success(res, event);
  };

  static remove = async (req, res) => {
    const result = await EventService.remove(req.params.id);
    return ApiResponse.success(res, result);
  };
}
