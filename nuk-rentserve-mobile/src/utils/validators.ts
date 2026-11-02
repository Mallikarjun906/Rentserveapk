// Input validation utilities

export function isValidPhone(phone: string): boolean {
  const clean = phone.replace(/\D/g, '');
  return clean.length === 10;
}

export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

export function isValidPassword(password: string): boolean {
  return typeof password === 'string' && password.length >= 6;
}

export function isValidName(name: string): boolean {
  return typeof name === 'string' && name.trim().length >= 2;
}

export function isValidAadhaar(aadhaar: string): boolean {
  const clean = aadhaar.replace(/\D/g, '');
  return clean.length === 12;
}

export function isValidRegistrationNumber(reg: string): boolean {
  // Karnataka format example: KA 29 AB 1234 or KA29AB1234
  const clean = reg.replace(/\s+/g, '').toUpperCase();
  return /^[A-Z]{2}\d{1,2}[A-Z]{1,3}\d{4}$/.test(clean);
}
