export function validateAuth(values: { name?: string; email: string; password?: string; confirm?: string }, mode: 'signup' | 'login' | 'forgot') {
 const errors: Record<string,string> = {};
 if (mode === 'signup' && !values.name?.trim()) errors['name'] = 'Enter your full name.';
 if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors['email'] = 'Enter a valid email address.';
 if (mode !== 'forgot' && !values.password) errors['password'] = 'Enter your password.';
 if (mode === 'signup' && (values.password?.length ?? 0) < 8) errors['password'] = 'Use at least 8 characters.';
 if (mode === 'signup' && values.password !== values.confirm) errors['confirm'] = 'Passwords don’t match.';
 return errors;
}
