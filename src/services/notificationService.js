import { db } from '../firebase';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';

const COLLECTION = 'notifications';

export async function addNotification({ title, message, expiresAt }) {
  const docRef = await addDoc(collection(db, COLLECTION), {
    title,
    message,
    createdAt: serverTimestamp(),
    expiresAt: Timestamp.fromDate(new Date(expiresAt)),
    isDeleted: false,
  });
  return docRef.id;
}

export function subscribeToNotifications(callback) {
  const q = query(
    collection(db, COLLECTION),
    where('isDeleted', '==', false)
  );

  return onSnapshot(q,
    (snapshot) => {
      const now = new Date();
      const notifications = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(n => {
          const exp = n.expiresAt?.toDate?.() || new Date(n.expiresAt);
          return exp > now;
        })
        .sort((a, b) => {
          const aDate = a.createdAt?.toDate?.() || new Date(a.createdAt);
          const bDate = b.createdAt?.toDate?.() || new Date(b.createdAt);
          return bDate - aDate;
        });
      callback(notifications);
    },
    (error) => {
      console.error('Notification subscription error:', error);
      callback([]);
    }
  );
}