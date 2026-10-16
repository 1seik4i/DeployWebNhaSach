import { z } from 'zod';
import { HeritageStatus } from '@prisma/client';

export const idParams = z.object({ id: z.string().uuid() });
export const paginationFields = {
  page: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(1000000)).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(100)).default('20'),
};
const optionalText = max => z.string().trim().max(max).nullable().optional();
const coordinate = z.number().finite().min(-9999.99).max(9999.99).nullable().optional();
const content = z.object({
  code: optionalText(20),
  name: z.string().trim().min(1).max(200),
  nameEn: optionalText(200),
  province: optionalText(120), provinceEn: optionalText(120),
  category: optionalText(120), categoryEn: optionalText(120),
  period: optionalText(120), periodEn: optionalText(120),
  address: optionalText(50000), addressEn: optionalText(50000),
  briefDesc: optionalText(50000), briefDescEn: optionalText(50000),
  story: optionalText(50000), storyEn: optionalText(50000),
  highlights: z.array(z.string().trim().max(5000)).max(100).optional(),
  highlightsEn: z.array(z.string().trim().max(5000)).max(100).optional(),
  referenceSource: optionalText(50000),
  status: z.nativeEnum(HeritageStatus).optional(),
  imageUrl: optionalText(5000), imageAlt: optionalText(5000),
  imageSource: optionalText(5000), imageLicense: optionalText(5000),
  mapX: coordinate, mapY: coordinate, mapAreaName: optionalText(120),
});
export const heritageListSchema = z.object({ query: z.object({
  ...paginationFields,
  search: z.string().trim().max(200).optional(),
  status: z.nativeEnum(HeritageStatus).optional(),
}) });
export const heritageIdSchema = z.object({ params: idParams });
export const heritageCreateSchema = z.object({ body: content.extend({
  slug: z.string().trim().toLowerCase().min(1).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
}).strict() });
export const heritageUpdateSchema = z.object({
  params: idParams,
  // Preserve the submitted slug exactly so a change is never silently normalized away.
  body: content.partial().extend({ slug: z.string().optional() }).strict()
    .refine(value => Object.keys(value).length > 0, 'Cần ít nhất một trường cập nhật'),
});
