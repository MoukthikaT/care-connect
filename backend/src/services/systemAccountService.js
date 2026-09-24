import User from '../models/User.js';
import { ROLES } from '../config/constants.js';

const SYSTEM_ACCOUNTS = [
  { name: 'Operations Manager', email: 'omcare@connect.com', passwordEnv: 'OPS_MANAGER_PASSWORD', role: ROLES.OPS_MANAGER },
  { name: 'Platform Admin', email: 'pacare@connect.com', passwordEnv: 'PLATFORM_ADMIN_PASSWORD', role: ROLES.ADMIN },
  { name: 'Support Agent', email: 'support@careconnect.com', passwordEnv: 'SUPPORT_AGENT_PASSWORD', role: ROLES.SUPPORT_AGENT }
];

export const ensureSystemAccounts = async () => {
  for (const account of SYSTEM_ACCOUNTS) {
    const email = account.email.toLowerCase();
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      const password = process.env[account.passwordEnv];
      if (!password) {
        console.warn(`[System Account] Skipped provisioning ${email}: ${account.passwordEnv} is not configured.`);
        continue;
      }
      await User.create({
        name: account.name,
        email,
        password,
        phone: process.env[`${account.passwordEnv}_PHONE`] || 'Not provided',
        role: account.role,
        status: 'Active'
      });
      console.log(`[System Account] Created: ${email}`);
      continue;
    }
    if (existingUser.role !== account.role) {
      existingUser.role = account.role;
      await existingUser.save();
    }
    console.log(`[System Account] Ready: ${email}`);
  }
};
