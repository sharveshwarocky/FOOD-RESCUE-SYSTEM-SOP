export const MOCK_METRICS = {
  total_donations: 28,
  total_deliveries: 24,
  total_beneficiaries: 480,
  food_saved_kg: "70.0 kg",
  active_volunteers: 4,
  pending_requests: 2,
  registered_ngos: 5,
  registered_donors: 8
};

export const MOCK_DONATIONS = [
  {
    id: 1,
    title: 'Surplus Buffet Meals & Rice Bowls',
    description: 'Freshly prepared vegetarian rice bowls, dal, and chapati from evening banquet event.',
    food_type: 'Cooked Meals',
    quantity: '60 Meals',
    donor_name: 'Grand Palace Hotel & Catering',
    pickup_address: '123 Hospitality Avenue, Sector 18',
    latitude: 28.6139,
    longitude: 77.2090,
    status: 'VOLUNTEER_ASSIGNED',
    created_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 2,
    title: 'Fresh Bakery Breads & Muffins',
    description: 'Assorted whole wheat breads, dinner rolls, and fruit muffins baked today.',
    food_type: 'Bakery Items',
    quantity: '35 Packs',
    donor_name: 'Grand Palace Hotel & Catering',
    pickup_address: '123 Hospitality Avenue, Sector 18',
    latitude: 28.6139,
    longitude: 77.2090,
    status: 'APPROVED',
    created_at: new Date(Date.now() - 7200000).toISOString()
  }
];
