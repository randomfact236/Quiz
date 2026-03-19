/**
 * ============================================================================
 * Create Admin CLI
 * ============================================================================
 * Usage: npm run create-admin -- --email=<email> --password=<password> [name]
 * 
 * Examples:
 *   npm run create-admin -- --email=admin@example.com --password=mypassword
 *   npm run create-admin -- --email=admin@example.com --password=mypassword "Admin User"
 * 
 * Alternative (positional):
 *   npm run create-admin -- admin@example.com mypassword
 * ============================================================================
 */

import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';

import { User } from '../users/entities/user.entity';

import { getDatabaseConfig, validateDatabaseEnv } from './database-config';


function parseArgs(args: string[]): { email: string; password: string; name: string } | null {
  let email = '';
  let password = '';
  let name = 'Admin User';

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    // Handle --email=xxx or --email xxx
    if (arg.startsWith('--email=')) {
      email = arg.replace('--email=', '');
    } else if (arg === '--email' && args[i + 1]) {
      email = args[++i];
    }
    
    // Handle --password=xxx or --password xxx
    if (arg.startsWith('--password=')) {
      password = arg.replace('--password=', '');
    } else if (arg === '--password' && args[i + 1]) {
      password = args[++i];
    }
    
    // Handle --name=xxx or --name xxx
    if (arg.startsWith('--name=')) {
      name = arg.replace('--name=', '');
    } else if (arg === '--name' && args[i + 1]) {
      name = args[++i];
    }
  }

  // Fallback to positional arguments if no flags provided
  if (!email && !password && args.length >= 2) {
    email = args[0];
    password = args[1];
    if (args[2]) {name = args[2];}
  }

  if (email && password) {
    return { email, password, name };
  }
  return null;
}

async function createAdmin(): Promise<void> {
  const args = process.argv.slice(2);
  const parsed = parseArgs(args);
  
  if (!parsed) {
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║              AI Quiz Platform - Create Admin CLI                         ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  Usage: npm run create-admin -- [options]                               ║
║                                                                       ║
║  Options:                                                              ║
║    --email=<email>     Admin email address (required)                ║
║    --password=<pwd>    Admin password (required)                     ║
║    --name=<name>       Admin display name (optional, default: Admin)║
║                                                                       ║
║  Examples:                                                            ║
║    npm run create-admin -- --email=admin@example.com --password=pass   ║
║    npm run create-admin -- --email=admin@site.com --password=x --name="Super Admin"
║                                                                       ║
║  Alternative (positional):                                            ║
║    npm run create-admin -- admin@example.com mypassword               ║
╚═══════════════════════════════════════════════════════════════════════════╝
    `);
    process.exit(1);
  }

  const { email, password, name } = parsed;

  console.log(`\n🔧 Creating admin user: ${email}`);

  try {
    validateDatabaseEnv();
  } catch (error) {
    console.error('❌ Environment validation failed:', (error as Error).message);
    process.exit(1);
  }

  const dataSource = new DataSource(getDatabaseConfig());

  try {
    await dataSource.initialize();
    console.log('✅ Database connected');

    const userRepo = dataSource.getRepository(User);

    // Check if user already exists
    const existingUser = await userRepo.findOne({ where: { email } });
    
    if (existingUser) {
      // Update existing user to admin
      const hashedPassword = await bcrypt.hash(password, 12);
      await userRepo.update(existingUser.id, {
        password: hashedPassword,
        name,
        role: 'admin',
      });
      console.log(`✅ Admin user updated: ${email}`);
    } else {
      // Create new admin user
      const hashedPassword = await bcrypt.hash(password, 12);
      const admin = userRepo.create({
        email,
        password: hashedPassword,
        name,
        role: 'admin',
      });
      await userRepo.save(admin);
      console.log(`✅ Admin user created: ${email}`);
    }

    console.log(`\n🎉 Admin setup complete!`);
    console.log(`   Email: ${email}`);
    console.log(`   Role: admin\n`);

    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to create admin:', (error as Error).message);
    await dataSource.destroy().catch(() => {});
    process.exit(1);
  }
}

createAdmin();
