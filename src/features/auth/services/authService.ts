import { authApi } from '../../../api/auth.api';
export const authService = {
  requestPasswordReset: (email: string) => authApi.forgotPassword(email),
};
