import { jwtDecode } from 'jwt-decode';

interface JWTPayload {
  sub: string;
  playerId: string;
  email: string;
  jti: string;
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'?: string;
  exp: number;
  iss: string;
  aud: string;
}

export const getTokenPayload = (token: string): JWTPayload | null => {
  try {
    return jwtDecode<JWTPayload>(token);
  } catch (error) {
    console.error('Failed to decode JWT token:', error);
    return null;
  }
};

export const isTokenValid = (token: string): boolean => {
  try {
    const payload = getTokenPayload(token);
    if (!payload) return false;
    
    const currentTime = Date.now() / 1000;
    return payload.exp > currentTime;
  } catch (error) {
    return false;
  }
};

export const hasAdministratorRole = (token: string): boolean => {
  try {
    const payload = getTokenPayload(token);
    if (!payload) return false;
    
    // Check for Administrator role in the standard claims
    const role = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    return role === 'Administrator';
  } catch (error) {
    console.error('Failed to check administrator role:', error);
    return false;
  }
};

export const getUserEmail = (token: string): string | null => {
  try {
    const payload = getTokenPayload(token);
    return payload?.email || null;
  } catch (error) {
    return null;
  }
};