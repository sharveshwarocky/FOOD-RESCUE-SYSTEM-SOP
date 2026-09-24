import api from './api';

export const donorService = {
  postFood: (formData) => api.post('/donor/post-food', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getMyDonations: () => api.get('/donor/my-donations'),
  getRequests: () => api.get('/donor/requests'),
  respondRequest: (requestId, action) => api.post(`/donor/requests/${requestId}/respond`, { action }),
  cancelDonation: (donationId) => api.post(`/donor/donations/${donationId}/cancel`)
};
