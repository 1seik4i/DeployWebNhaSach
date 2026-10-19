import { prisma } from '../../config/database.js';
import { ApiError } from '../../utils/ApiError.js';
import { getPagination } from '../../utils/pagination.js';
import { transaction, parse } from '../../utils/contract.js';
import { listProposalSchema } from './proposal.validation.js';

export class ProposalService {
  static async list(query = {}) {
    query = parse(listProposalSchema, { query }).query;
    const { page, limit, skip, meta } = getPagination(query);

    const where = {};
    if (query.eventId) where.eventId = query.eventId;

    if (query.status && ['pending', 'approved', 'need_revision', 'rejected', 'withdrawn'].includes(query.status)) {
      where.status = query.status;
    }

    if (query.fromDate || query.toDate) {
      where.submittedAt = {};
      if (query.fromDate && !isNaN(Date.parse(query.fromDate))) {
        where.submittedAt.gte = new Date(query.fromDate);
      }
      if (query.toDate && !isNaN(Date.parse(query.toDate))) {
        const nextDay = new Date(query.toDate);
        nextDay.setUTCDate(nextDay.getUTCDate() + 1);
        where.submittedAt.lt = nextDay;
      }
    }

    const [total, proposals] = await Promise.all([
      prisma.activityProposal.count({ where }),
      prisma.activityProposal.findMany({
        where,
        skip,
        take: limit,
        orderBy: { submittedAt: 'desc' },
        include: {
          event: {
            select: { id: true, title: true },
          },
          organization: {
            select: {
              id: true,
              name: true,
              boothAssignments: {
                where: { status: 'active' },
                include: { booth: true },
              },
            },
          },
          location: {
            select: { id: true, name: true },
          },
        },
      }),
    ]);

    return {
      data: proposals,
      meta: meta(total),
    };
  }

  static async getById(id) {
    const proposal = await prisma.activityProposal.findUnique({
      where: { id },
      include: {
        event: true,
        organization: true,
        location: true,
        devices: {
          include: { asset: true },
        },
        reviews: {
          include: {
            reviewer: {
              select: {
                id: true,
                fullName: true,
                email: true,
                primaryRole: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!proposal) {
      throw ApiError.notFound('Không tìm thấy đề xuất');
    }

    return proposal;
  }

  static async approve(id, input = {}, user) {
    const proposal = await prisma.activityProposal.findUnique({
      where: { id },
    });

    if (!proposal) {
      throw ApiError.notFound('Không tìm thấy đề xuất');
    }

    if (!['pending', 'need_revision'].includes(proposal.status)) {
      throw ApiError.conflict(
        `Không thể phê duyệt đề xuất có trạng thái '${proposal.status}'`,
        'INVALID_PROPOSAL_STATUS',
      );
    }

    const note = typeof input?.note === 'string' && input.note.trim() ? input.note.trim() : null;

    return await transaction(async (tx) => {
      const current = await tx.activityProposal.findUnique({ where: { id } });
      if (!current || current.status !== proposal.status) throw ApiError.conflict('Đề xuất đã được xử lý bởi người khác');
      const updateData = { status: 'approved' };
      if (note) {
        updateData.managementNotes = note;
      }

      const updated = await tx.activityProposal.update({
        where: { id },
        data: updateData,
        include: {
          event: true,
          organization: true,
          location: true,
        },
      });

      const review = await tx.activityReview.create({
        data: {
          proposalId: id,
          reviewerId: user.id,
          action: 'approve',
          note,
        },
        include: {
          reviewer: {
            select: {
              id: true,
              fullName: true,
              email: true,
              primaryRole: true,
            },
          },
        },
      });

      return { ...updated, review };
    });
  }

  static async requestSupplement(id, input, user) {
    const proposal = await prisma.activityProposal.findUnique({
      where: { id },
    });

    if (!proposal) {
      throw ApiError.notFound('Không tìm thấy đề xuất');
    }

    if (proposal.status !== 'pending') {
      throw ApiError.conflict(
        `Chỉ có thể yêu cầu bổ sung cho đề xuất ở trạng thái 'pending' (hiện tại: '${proposal.status}')`,
        'INVALID_PROPOSAL_STATUS',
      );
    }

    const note = input.note.trim();

    return await transaction(async (tx) => {
      const current = await tx.activityProposal.findUnique({ where: { id } });
      if (!current || current.status !== proposal.status) throw ApiError.conflict('Đề xuất đã được xử lý bởi người khác');
      const updated = await tx.activityProposal.update({
        where: { id },
        data: {
          status: 'need_revision',
          managementNotes: note,
        },
        include: {
          event: true,
          organization: true,
          location: true,
        },
      });

      const review = await tx.activityReview.create({
        data: {
          proposalId: id,
          reviewerId: user.id,
          action: 'request_supplement',
          note,
        },
        include: {
          reviewer: {
            select: {
              id: true,
              fullName: true,
              email: true,
              primaryRole: true,
            },
          },
        },
      });

      return { ...updated, review };
    });
  }

  static async reject(id, input, user) {
    const proposal = await prisma.activityProposal.findUnique({
      where: { id },
    });

    if (!proposal) {
      throw ApiError.notFound('Không tìm thấy đề xuất');
    }

    if (!['pending', 'need_revision'].includes(proposal.status)) {
      throw ApiError.conflict(
        `Không thể từ chối đề xuất có trạng thái '${proposal.status}'`,
        'INVALID_PROPOSAL_STATUS',
      );
    }

    const note = typeof input?.note === 'string' && input.note.trim() ? input.note.trim() : null;

    return await transaction(async (tx) => {
      const current = await tx.activityProposal.findUnique({ where: { id } });
      if (!current || current.status !== proposal.status) throw ApiError.conflict('Đề xuất đã được xử lý bởi người khác');
      const updated = await tx.activityProposal.update({
        where: { id },
        data: {
          status: 'rejected',
          managementNotes: note,
        },
        include: {
          event: true,
          organization: true,
          location: true,
        },
      });

      const review = await tx.activityReview.create({
        data: {
          proposalId: id,
          reviewerId: user.id,
          action: 'reject',
          note,
        },
        include: {
          reviewer: {
            select: {
              id: true,
              fullName: true,
              email: true,
              primaryRole: true,
            },
          },
        },
      });

      const members = await tx.organizationMember.findMany({
        where: { organizationId: updated.organizationId },
        select: { userId: true },
      });
      if (members.length)
        await tx.notification.createMany({
          data: members.map(({ userId }) => ({
            userId,
            title: "Đề xuất hoạt động không được duyệt",
            message: note
              ? `Đề xuất \"${updated.title}\" không được duyệt. Ghi chú của Ban Quản Lý: ${note}`
              : `Đề xuất \"${updated.title}\" không được duyệt.`,
            kind: "activity",
            link: "/partner/activities",
          })),
        });

      return { ...updated, review };
    });
  }
}
