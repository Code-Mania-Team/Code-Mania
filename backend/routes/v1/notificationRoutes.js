import express from 'express';
import NotificationController from '../../controllers/v1/notificationController.js';
import { authentication } from '../../middlewares/authentication.js';

const notificationRouter = express.Router();
const controller = new NotificationController();

// All notification routes require authentication
notificationRouter.get('/', authentication, controller.getNotifications.bind(controller));
notificationRouter.get('/unread-count', authentication, controller.getUnreadCount.bind(controller));
notificationRouter.patch('/:notification_id/read', authentication, controller.markAsRead.bind(controller));
notificationRouter.patch('/read-all', authentication, controller.markAllAsRead.bind(controller));
notificationRouter.delete('/:notification_id', authentication, controller.deleteNotification.bind(controller));

export default notificationRouter;
