import { ProposalService } from './proposal.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';

export class ProposalController {
  static list = async (req, res) => {
    const result = await ProposalService.list(req.query);
    return ApiResponse.success(res, result.data, result.meta);
  };

  static getById = async (req, res) => {
    const proposal = await ProposalService.getById(req.params.id);
    return ApiResponse.success(res, proposal);
  };

  static approve = async (req, res) => {
    const result = await ProposalService.approve(req.params.id, req.body, req.user);
    return ApiResponse.success(res, result);
  };

  static requestSupplement = async (req, res) => {
    const result = await ProposalService.requestSupplement(req.params.id, req.body, req.user);
    return ApiResponse.success(res, result);
  };

  static reject = async (req, res) => {
    const result = await ProposalService.reject(req.params.id, req.body, req.user);
    return ApiResponse.success(res, result);
  };
}
