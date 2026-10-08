import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SERVICE_ACCOUNT_PATH = resolve(__dirname, '..', 'serviceAccountKey.json');
const QUESTIONS_JSON_PATH = resolve(__dirname, '..', 'src', 'data', 'counsellingQuestions.json');
const QUESTIONS_COL = 'counsellingQuestions';

async function main() {
  if (!existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error('❌ serviceAccountKey.json not found. Get it from Firebase Console → Project Settings → Service Accounts.');
    process.exit(1);
  }
  if (!existsSync(QUESTIONS_JSON_PATH)) {
    console.error('❌ counsellingQuestions.json not found.');
    process.exit(1);
  }

  const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf-8'));
  initializeApp({ credential: cert(serviceAccount) });
  const db = getFirestore();

  const seedQuestions = JSON.parse(readFileSync(QUESTIONS_JSON_PATH, 'utf-8'));

  console.log(`\n🧩 Counselling Question Bank Seed — Project: ${serviceAccount.project_id}`);
  console.log(`   Bundled questions: ${seedQuestions.length}\n`);

  const snap = await db.collection(QUESTIONS_COL).get();
  if (snap.size > 0) {
    console.log(`   Found ${snap.size} existing docs — deleting before overwrite...`);
  }
  for (const d of snap.docs) {
    await d.ref.delete();
  }

  const batch = db.batch();
  seedQuestions.forEach((q, i) => {
    batch.set(db.collection(QUESTIONS_COL).doc(q.id), {
      ...q,
      order: i,
      active: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
  await batch.commit();

  console.log(`   ✅ Seeded ${seedQuestions.length} questions.`);
  console.log('   The app now reads these from Firestore only (no auto-seed).\n');
  process.exit(0);
}

main();