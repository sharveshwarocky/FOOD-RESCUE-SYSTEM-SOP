import api from './api';

export const volunteerService = {
  getAvailableTasks: () => api.get('/volunteer/available-tasks'),
  claimTask: (request_id) => api.post('/volunteer/claim-task', { request_id }),
  getAssignments: () => api.get('/volunteer/assignments'),
  respondAssignment: (assignmentId, action) => api.post(`/volunteer/assignments/${assignmentId}/respond`, { action }),
  updateStatus: (assignment_id, status) => api.post('/volunteer/update-status', { assignment_id, status }),
  uploadProof: (formData) => api.post('/volunteer/upload-proof', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateLocation: (latitude, longitude) => api.post('/volunteer/location', { latitude, longitude })
};
