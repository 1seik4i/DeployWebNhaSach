import { prisma } from '../src/config/database.js';
try {
  const rows = await prisma.event.findMany({ orderBy: { createdAt: 'asc' }, select: { id: true, title: true, startAt: true, endAt: true, status: true, visibility: true, isDeleted: true, _count: { select: { activities: true, proposals: true, applications: true, publicRegistrations: true } } } });
  const demo = rows.filter(row => !/\d{13}|^flow-|^api-|^guest-|^test-|^demo-/i.test(row.title));
  console.log(JSON.stringify({ total: rows.length, active: rows.filter(row => !row.isDeleted).length, candidates: demo, proposalStatuses: await prisma.activityProposal.groupBy({ by: ['status'], _count: { _all: true } }) }, null, 2));
} finally { await prisma.$disconnect(); }
