export interface UserPayload {
  id: string;
  email: string;
  role: 'ADMIN' | 'COMPANY' | 'DRIVER';
  companyId?: string; // Importante para a lógica que criamos antes
  iat?: number;
  exp?: number;
}