// src/services/dbServie.js
import { db } from '../firebase/config';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  doc,
  updateDoc 
} from 'firebase/firestore';

// --- المنتجات (Products) ---
export const getProducts = async (userId) => {
  if (!userId) return [];
  const q = query(collection(db, 'products'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addProduct = async (productData, userId) => {
  if (!userId) return;
  return await addDoc(collection(db, 'products'), {
    ...productData,
    userId,
    createdAt: new Date().toISOString()
  });
};

export const deleteProduct = async (productId) => {
  await deleteDoc(doc(db, 'products', productId));
};

// --- الفواتير والتجميع (Invoices) ---
export const getInvoices = async (userId) => {
  if (!userId) return [];
  const q = query(collection(db, 'invoices'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const createTransaction = async (transactionData, userId) => {
  if (!userId) return;
  return await addDoc(collection(db, 'invoices'), {
    ...transactionData,
    userId,
    createdAt: new Date().toISOString()
  });
};

// --- الديون والعملاء (Debts) ---
export const getDebts = async (userId) => {
  if (!userId) return [];
  const q = query(collection(db, 'debts'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addDebt = async (debtData, userId) => {
  if (!userId) return;
  return await addDoc(collection(db, 'debts'), {
    ...debtData,
    userId,
    createdAt: new Date().toISOString()
  });
};

export const updateDebt = async (debtId, updatedFields) => {
  const debtRef = doc(db, 'debts', debtId);
  return await updateDoc(debtRef, updatedFields);
};

export const deleteDebt = async (debtId) => {
  const debtRef = doc(db, 'debts', debtId);
  return await deleteDoc(debtRef);
};