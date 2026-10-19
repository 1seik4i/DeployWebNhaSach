import { z } from 'zod';
import { parse } from './contract.js';
import { paginationFields } from './input.validation.js';

export const getPagination = (query) => {
  const { page, limit } = parse(z.object(paginationFields), query);
  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
    meta: (total) => ({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }),
  };
};
