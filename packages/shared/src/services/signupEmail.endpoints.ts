export const signupEmailEndpoints = {
  save: `/signup-emails`,
  getAll: `/signup-emails`,
  addManual: `/signup-emails/manual`,
  delete: (id: number) => `/signup-emails/${id}`,
  markConverted: `/signup-emails/mark-converted`,
};
