import api from './api';

export const volunteerService = {
  getAssignments: () => api.get('/volunteer/assignments'),
  respondAssignment: (assignmentId, action) => api.post(`/volunteer/assignments/${assignmentId}/respond`, { action }),
  updateStatus: (assignment_id, status) => api.post('/volunteer/update-status', { assignment_id, status }),
  uploadProof: (formData) => api.post('/volunteer/upload-proof', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateLocation: (latitude, longitude) => api.post('/volunteer/location', { latitude, longitude })
};
