import api from './api';

export const notificationService = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (id) => api.post(`/notifications/${id}/read`)
};
