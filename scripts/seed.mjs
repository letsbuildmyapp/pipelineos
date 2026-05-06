// Optional Firestore seed — only runs against the running emulator.
// Usage:
//   firebase emulators:start --project demo-pipelineos --only auth,firestore,functions
//   node scripts/seed.mjs
//
// The app itself ships with a fully seeded local store; this is for when
// you want the same data in Firestore for end-to-end demos.

import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, setDoc, writeBatch, collection } from 'firebase/firestore';
import { buildSeed } from '../src/data/seed.ts';

const PROJECT_ID = 'demo-pipelineos';
const PASSWORD = 'demo1234';

const app = initializeApp({ projectId: PROJECT_ID, apiKey: 'demo-api-key' });
const auth = getAuth(app);
connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
const db = getFirestore(app);
connectFirestoreEmulator(db, '127.0.0.1', 8080);

const { users, contacts, deals, activities, tasks, settings } = buildSeed();

async function ensureUser(email) {
  try { await createUserWithEmailAndPassword(auth, email, PASSWORD); }
  catch (e) {
    if (!String(e.message).includes('email-already-in-use')) throw e;
    await signInWithEmailAndPassword(auth, email, PASSWORD);
  }
}

console.log('Creating auth users…');
for (const u of users) await ensureUser(u.email);

console.log('Writing user profiles…');
for (const u of users) await setDoc(doc(db, 'users', u.uid), u);

async function batchWrite(name, items) {
  console.log(`Writing ${items.length} ${name}…`);
  const chunks = [];
  for (let i = 0; i < items.length; i += 400) chunks.push(items.slice(i, i + 400));
  for (const chunk of chunks) {
    const b = writeBatch(db);
    for (const item of chunk) b.set(doc(collection(db, name), item.id), item);
    await b.commit();
  }
}

await batchWrite('contacts', contacts);
await batchWrite('deals', deals);
await batchWrite('activities', activities);
await batchWrite('tasks', tasks);
await setDoc(doc(db, 'settings', 'workspace'), settings);

console.log('Done. Users:', users.map((u) => `${u.email} / ${PASSWORD}`).join(', '));
process.exit(0);
