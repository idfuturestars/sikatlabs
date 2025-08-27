import { db } from '../server/db.js';
import { users } from '@shared/schema';

async function checkUsers() {
  try {
    const existingUsers = await db.select().from(users);
    console.log('Existing users:');
    existingUsers.forEach(u => {
      console.log(`  ID: ${u.id}, Username: ${u.username}, Email: ${u.email}`);
    });
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    process.exit(0);
  }
}

checkUsers();