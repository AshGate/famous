import express from 'express';
import embedRoutes from './embedRoutes.js';
import ticketRoutes from './ticketRoutes.js';
import appointmentRoutes from './appointmentRoutes.js';
import invoiceRoutes from './invoiceRoutes.js';
import recruitmentRoutes from './recruitmentRoutes.js';
import whitelistRoutes from './whitelistRoutes.js';
import channelRoutes from './channelRoutes.js';
import roleRoutes from './roleRoutes.js';

const router = express.Router();

router.use('/api/channels', channelRoutes);
router.use('/api/roles', roleRoutes);
router.use('/api/embeds', embedRoutes);
router.use('/api/tickets', ticketRoutes);
router.use('/api/appointments', appointmentRoutes);
router.use('/api/invoices', invoiceRoutes);
router.use('/api/recruitment', recruitmentRoutes);
router.use('/api/whitelist', whitelistRoutes);

export default router;