import { db } from '../firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, where, limit, startAfter, serverTimestamp } from 'firebase/firestore';

const COLLECTION = 'images';

export const addImage = async ({ url, publicId, title, description, categories, subCategory }) => {
  const cats = categories?.length ? categories : ['uncategorized'];
  return await addDoc(collection(db, COLLECTION), {
    url,
    publicId,
    title: title || '',
    description: description || '',
    categories: cats,
    category: cats[0],
    subCategory: subCategory || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
};

export const getImages = async () => {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const updateImage = async (id, data) => {
  return await updateDoc(doc(db, COLLECTION, id), { ...data, updatedAt: serverTimestamp() });
};

export const getImagesByCategory = async (category, subCategory) => {
  const constraints = [where('categories', 'array-contains', category)];
  if (subCategory) constraints.push(where('subCategory', '==', subCategory));
  const q = query(collection(db, COLLECTION), ...constraints);
  const snapshot = await getDocs(q);
  const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  return items.sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0));
};

export const getImagesPaginated = async ({ pageSize = 12, lastDoc, category }) => {
  const constraints = [];
  if (category && category !== 'all') constraints.push(where('categories', 'array-contains', category));
  constraints.push(orderBy('createdAt', 'desc'));
  constraints.push(limit(pageSize));
  if (lastDoc) constraints.push(startAfter(lastDoc));

  const q = query(collection(db, COLLECTION), ...constraints);
  const snapshot = await getDocs(q);
  const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  return {
    items,
    lastDoc: snapshot.docs[snapshot.docs.length - 1],
    hasMore: snapshot.docs.length === pageSize,
  };
};

export const deleteImageRecord = async (id) => {
  return await deleteDoc(doc(db, COLLECTION, id));
};
