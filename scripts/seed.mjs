import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SERVICE_ACCOUNT_PATH = resolve(__dirname, '..', 'serviceAccountKey.json');
const ENV_PATH = resolve(__dirname, '..', '.env');

function ask(query) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(query, (ans) => { rl.close(); resolve(ans.trim()); }));
}

function loadEnv() {
  if (!existsSync(ENV_PATH)) return {};
  const lines = readFileSync(ENV_PATH, 'utf-8').split('\n');
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [key, ...rest] = trimmed.split('=');
    env[key.trim()] = rest.join('=').trim();
  }
  return env;
}

const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  STAFF: 'staff',
  STUDENT: 'student',
  GUEST: 'guest',
};

const STAFF_SUBTYPES = {
  PRINCIPAL: 'principal',
  TEACHER: 'teacher',
  RECEPTION: 'reception',
  LIBRARIAN: 'librarian',
};

const PERMISSIONS = {
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_ACTIVATE: 'user:activate',
  USER_DEACTIVATE: 'user:deactivate',
  USER_RESET_PASSWORD: 'user:reset_password',
  ROLE_CREATE: 'role:create',
  ROLE_READ: 'role:read',
  ROLE_UPDATE: 'role:update',
  ROLE_DELETE: 'role:delete',
  ROLE_ASSIGN: 'role:assign',
  PERMISSION_CREATE: 'permission:create',
  PERMISSION_READ: 'permission:read',
  PERMISSION_UPDATE: 'permission:update',
  PERMISSION_DELETE: 'permission:delete',
  STUDENT_CREATE: 'student:create',
  STUDENT_READ: 'student:read',
  STUDENT_UPDATE: 'student:update',
  STUDENT_DELETE: 'student:delete',
  STAFF_CREATE: 'staff:create',
  STAFF_READ: 'staff:read',
  STAFF_UPDATE: 'staff:update',
  STAFF_DELETE: 'staff:delete',
  EXAM_CREATE: 'exam:create',
  EXAM_READ: 'exam:read',
  EXAM_UPDATE: 'exam:update',
  EXAM_DELETE: 'exam:delete',
  EXAM_TAKE: 'exam:take',
  EXAM_GRADE: 'exam:grade',
  CONTENT_CREATE: 'content:create',
  CONTENT_READ: 'content:read',
  CONTENT_UPDATE: 'content:update',
  CONTENT_DELETE: 'content:delete',
  SETTINGS_READ: 'settings:read',
  SETTINGS_UPDATE: 'settings:update',
  AUDIT_READ: 'audit:read',
  AUDIT_EXPORT: 'audit:export',
  PROFILE_READ: 'profile:read',
  PROFILE_UPDATE: 'profile:update',
};

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

const DEFAULT_ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: ALL_PERMISSIONS,
  [ROLES.ADMIN]: [
    PERMISSIONS.USER_CREATE, PERMISSIONS.USER_READ, PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_ACTIVATE, PERMISSIONS.USER_DEACTIVATE, PERMISSIONS.USER_RESET_PASSWORD,
    PERMISSIONS.ROLE_READ, PERMISSIONS.ROLE_ASSIGN, PERMISSIONS.PERMISSION_READ,
    PERMISSIONS.STUDENT_CREATE, PERMISSIONS.STUDENT_READ, PERMISSIONS.STUDENT_UPDATE, PERMISSIONS.STUDENT_DELETE,
    PERMISSIONS.STAFF_CREATE, PERMISSIONS.STAFF_READ, PERMISSIONS.STAFF_UPDATE, PERMISSIONS.STAFF_DELETE,
    PERMISSIONS.EXAM_CREATE, PERMISSIONS.EXAM_READ, PERMISSIONS.EXAM_UPDATE, PERMISSIONS.EXAM_DELETE, PERMISSIONS.EXAM_GRADE,
    PERMISSIONS.CONTENT_CREATE, PERMISSIONS.CONTENT_READ, PERMISSIONS.CONTENT_UPDATE, PERMISSIONS.CONTENT_DELETE,
    PERMISSIONS.SETTINGS_READ, PERMISSIONS.SETTINGS_UPDATE, PERMISSIONS.PROFILE_READ, PERMISSIONS.PROFILE_UPDATE,
  ],
  [ROLES.STAFF]: {
    [STAFF_SUBTYPES.PRINCIPAL]: [
      PERMISSIONS.STUDENT_READ, PERMISSIONS.STUDENT_CREATE, PERMISSIONS.STUDENT_UPDATE,
      PERMISSIONS.STAFF_READ, PERMISSIONS.EXAM_READ, PERMISSIONS.EXAM_CREATE, PERMISSIONS.EXAM_UPDATE, PERMISSIONS.EXAM_GRADE,
      PERMISSIONS.CONTENT_READ, PERMISSIONS.CONTENT_CREATE, PERMISSIONS.PROFILE_READ, PERMISSIONS.PROFILE_UPDATE,
    ],
    [STAFF_SUBTYPES.TEACHER]: [
      PERMISSIONS.STUDENT_READ, PERMISSIONS.STUDENT_CREATE, PERMISSIONS.STUDENT_UPDATE,
      PERMISSIONS.EXAM_READ, PERMISSIONS.EXAM_CREATE, PERMISSIONS.EXAM_UPDATE, PERMISSIONS.EXAM_GRADE,
      PERMISSIONS.CONTENT_READ, PERMISSIONS.CONTENT_CREATE, PERMISSIONS.PROFILE_READ, PERMISSIONS.PROFILE_UPDATE,
    ],
    [STAFF_SUBTYPES.RECEPTION]: [
      PERMISSIONS.STUDENT_READ, PERMISSIONS.STUDENT_CREATE, PERMISSIONS.PROFILE_READ, PERMISSIONS.PROFILE_UPDATE,
    ],
    [STAFF_SUBTYPES.LIBRARIAN]: [
      PERMISSIONS.STUDENT_READ, PERMISSIONS.PROFILE_READ, PERMISSIONS.PROFILE_UPDATE,
    ],
  },
  [ROLES.STUDENT]: [
    PERMISSIONS.PROFILE_READ, PERMISSIONS.PROFILE_UPDATE, PERMISSIONS.EXAM_READ, PERMISSIONS.EXAM_TAKE, PERMISSIONS.CONTENT_READ,
  ],
  [ROLES.GUEST]: [],
};

async function seed() {
  console.log('\n🔧 Firebase Seed Script\n');

  // Init firebase-admin
  if (!existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error('❌ serviceAccountKey.json not found. Get it from Firebase Console → Project Settings → Service Accounts → Generate new private key.');
    process.exit(1);
  }

  const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf-8'));
  initializeApp({ credential: cert(serviceAccount) });
  const db = getFirestore();
  const auth = getAuth();

  const projectId = serviceAccount.project_id;
  console.log(`📍 Project: ${projectId}\n`);

  // Step 1: Seed permissions
  console.log('📦 Seeding permissions...');
  const permDocs = await db.collection('permissions').get();
  const existingPermKeys = new Set(permDocs.docs.map((d) => d.data().key));

  for (const [key, value] of Object.entries(PERMISSIONS)) {
    if (!existingPermKeys.has(value)) {
      await db.collection('permissions').add({
        key: value,
        name: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
        group: value.split(':')[0],
        createdAt: FieldValue.serverTimestamp(),
      });
      console.log(`  + ${value}`);
    }
  }
  console.log(`  ✅ ${Object.keys(PERMISSIONS).length} permissions synced`);

  // Step 2: Seed roles
  console.log('\n📦 Seeding roles...');
  const roleDocs = await db.collection('roles').get();
  const existingRoleNames = new Set(roleDocs.docs.map((d) => d.data().name));

  const roleHierarchy = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF, ROLES.STUDENT, ROLES.GUEST];
  for (const [index, role] of roleHierarchy.entries()) {
    if (!existingRoleNames.has(role)) {
      await db.collection('roles').add({
        name: role,
        description: role === ROLES.SUPER_ADMIN ? 'Unrestricted access to the entire application' :
                     role === ROLES.ADMIN ? 'Can manage users, exams, and content' :
                     role === ROLES.STAFF ? 'Staff with role subtypes (teacher, principal, etc.)' :
                     role === ROLES.STUDENT ? 'Can take exams and view results' :
                     'Unauthenticated public access',
        hierarchy: index,
        isSystem: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      console.log(`  + ${role}`);
    }
  }
  console.log(`  ✅ ${roleHierarchy.length} roles synced`);

  // Step 3: Seed role-permissions
  console.log('\n📦 Seeding role-permissions...');
  for (const [role, perms] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    const rpRef = db.collection('rolePermissions').doc(role);
    const rpSnap = await rpRef.get();

    if (!rpSnap.exists) {
      const flatPerms = Array.isArray(perms) ? perms : [...new Set(Object.values(perms).flat())];
      await rpRef.set({
        roleId: role,
        permissions: flatPerms,
        updatedAt: FieldValue.serverTimestamp(),
      });
      console.log(`  + ${role} (${flatPerms.length} permissions)`);
    }
  }
  console.log('  ✅ Role-permissions synced');

  // Step 4: Create Super Admin
  console.log('\n👤 Setting up Super Admin...');

  const env = loadEnv();
  let superAdminEmail = env.VITE_SUPER_ADMIN_EMAIL;

  if (superAdminEmail && superAdminEmail !== 'your_actual_email_here') {
    console.log(`  Using email from .env: ${superAdminEmail}`);
  } else {
    superAdminEmail = await ask('  Enter Super Admin email: ');
  }

  if (!superAdminEmail) {
    console.log('  ⏭ Skipping user creation (no email provided).');
  } else {
    try {
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(superAdminEmail);
        console.log(`  ✅ User exists in Auth: ${superAdminEmail} (uid: ${userRecord.uid})`);
      } catch {
        const password = await ask('  User not found in Auth. Enter temporary password (min 6 chars): ');
        userRecord = await auth.createUser({
          email: superAdminEmail,
          password: password || 'TempPass123!',
          displayName: 'Super Admin',
        });
        console.log(`  ✅ Created Auth user: ${superAdminEmail} (uid: ${userRecord.uid})`);
      }

      const userDoc = await db.collection('users').doc(userRecord.uid).get();
      if (userDoc.exists) {
          console.log('  ✅ User Firestore document already exists');
        await db.collection('users').doc(userRecord.uid).update({
          role: ROLES.SUPER_ADMIN,
          updatedAt: FieldValue.serverTimestamp(),
        });
        console.log('  → Updated role to super_admin');
      } else {
        await db.collection('users').doc(userRecord.uid).set({
          id: userRecord.uid,
          email: superAdminEmail,
          displayName: 'Super Admin',
          role: ROLES.SUPER_ADMIN,
          roleSubtype: null,
          phone: '',
          status: 'active',
          profileImage: '',
          customFields: {},
          createdBy: null,
          forcePasswordChange: false,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          lastLoginAt: null,
        });
        console.log('  ✅ Created Firestore user document');
      }
    } catch (err) {
      console.error(`  ❌ Error setting up Super Admin:`, err.message);
    }
  }

  console.log('\n✅ Seed complete!');
  console.log('\n📋 Next steps:');
  console.log('  1. Update firestore.rules — replace VITE_SUPER_ADMIN_EMAIL with your email');
  console.log('  2. Deploy rules in Firebase Console → Firestore → Rules');
  console.log('  3. Set VITE_SUPER_ADMIN_EMAIL in .env (already done if you used .env)\n');
  process.exit(0);
}

seed();
