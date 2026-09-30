import api from './api';

export const ngoService = {
  getAvailableDonations: () => api.get('/ngo/available-donations'),
  acceptDonation: (donation_id, quality_status, quality_notes) => api.post('/ngo/accept-donation', {
    donation_id, quality_status, quality_notes
  }),
  requestFood: (donation_id, quality_status, quality_notes) => api.post('/ngo/request-food', {
    donation_id, quality_status, quality_notes
  }),
  getMyRequests: () => api.get('/ngo/my-requests'),
  getVolunteerLocation: (requestId) => api.get(`/ngo/assignments/${requestId}/location`),
  getAssignments: () => api.get('/ngo/assignments'),
  confirmDelivery: (delivery_id, beneficiary_count, beneficiary_notes) => api.post('/ngo/confirm-delivery', {
    delivery_id, beneficiary_count, beneficiary_notes
  })
};
