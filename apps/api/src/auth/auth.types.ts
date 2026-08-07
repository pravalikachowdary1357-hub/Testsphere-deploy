import type { StringValue } from 'ms';

// jsonwebtoken's expiresIn only accepts a template-literal-typed duration string,
// which a runtime env-var value can never satisfy on its own — this cast is the
// single, explicit point of trust that our own addDuration() regex already validates.
export function asJwtDuration(value: string): StringValue {
  return value as StringValue;
}

export interface AccessTokenPayload {
  sub: string;
  email: string;
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
