#!/usr/bin/env node

/**
 * Password Hash Generator for Database Seeds
 *
 * Generates bcrypt hashes for use in SQL seed files.
 *
 * Usage:
 *   node infra/scripts/generate-password-hash.js "your-password"
 */

const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.error('Error: Password is required');
  console.log('\nUsage:');
  console.log('  node infra/scripts/generate-password-hash.js "your-password"');
  console.log('\nExample:');
  console.log('  node infra/scripts/generate-password-hash.js "password123"');
  process.exit(1);
}

const rounds = 10; // bcrypt rounds
const hash = bcrypt.hashSync(password, rounds);

console.log('\n=== Password Hash Generated ===\n');
console.log('Password:', password);
console.log('Hash:    ', hash);
console.log('\nCopy this hash into your SQL seed file:');
console.log(`'${hash}'`);
console.log('\n');
