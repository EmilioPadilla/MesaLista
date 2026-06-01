export const discountCodeEndpoints = {
  validate: (code: string) => `/discount-codes/validate/${code}`,
  getAllAdmin: `/discount-codes/admin/all`,
  getStatsAdmin: (id: number) => `/discount-codes/admin/${id}/stats`,
  createAdmin: `/discount-codes/admin`,
  updateAdmin: (id: number) => `/discount-codes/admin/${id}`,
  deleteAdmin: (id: number) => `/discount-codes/admin/${id}`,
};
