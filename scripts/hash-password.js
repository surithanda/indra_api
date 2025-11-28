const bcrypt = require('bcrypt');

const password = process.argv[2] || 'Admin@123';
const rounds = 10;

bcrypt.hash(password, rounds, (err, hash) => {
  if (err) {
    console.error('Error hashing password:', err);
    process.exit(1);
  }
  
  console.log('\n===========================================');
  console.log('Password Hash Generated');
  console.log('===========================================');
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('\nSQL Update Command:');
  console.log(`UPDATE admin_users SET password_hash = '${hash}' WHERE username = 'admin';`);
  console.log('===========================================\n');
});
