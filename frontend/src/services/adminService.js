import api from './api';

export const adminService = {
  getNGOs: () => api.get('/admin/ngos'),
  getDonors: () => api.get('/admin/donors'),
  getVolunteers: () => api.get('/admin/volunteers'),
  updateUserStatus: (user_id, status) => api.post('/admin/users/approve-status', { user_id, status }),
  getDonations: () => api.get('/admin/donations'),
  verifyDonation: (donationId) => api.post(`/admin/donations/${donationId}/verify`),
  getRequests: () => api.get('/admin/requests'),
  assignVolunteer: (request_id, volunteer_id) => api.post('/admin/assign-volunteer', { request_id, volunteer_id }),
  getAssignments: () => api.get('/admin/assignments'),
  getNearbyVolunteers: (donationId) => api.get(`/admin/donations/${donationId}/nearby-volunteers`),
  getLiveTracking: () => api.get('/admin/tracking'),
  getAnalytics: () => api.get('/admin/analytics'),
  getReports: () => api.get('/admin/reports'),
  getLogs: () => api.get('/admin/logs'),
};
