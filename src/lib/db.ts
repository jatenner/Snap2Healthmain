/**
 * Mock database client for development
 */
export const db = {
  user: {
    findUnique: async () => ({
      id: 'mock-user-id',
      name: 'Mock User',
      email: 'user@example.com',
      image: null,
    }),
  },
}; 