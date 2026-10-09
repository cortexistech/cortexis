import { randomBytes, scryptSync } from 'node:crypto';
const salt = randomBytes(16).toString('hex');
console.log(`${salt}:${scryptSync(process.argv[2] || '', salt, 64).toString('hex')}`);
