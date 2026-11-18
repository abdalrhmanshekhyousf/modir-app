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
  updateDoc,
  runTransaction,
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

export const updateProduct = async (productId, updatedFields) => {
  return await updateDoc(doc(db, 'products', productId), {
    ...updatedFields,
    updatedAt: new Date().toISOString()
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

/**
 * خطأ يُرمى عندما لا تكفي الكمية المتوفرة لإتمام البيع.
 * يحمل قائمة بالمنتجات الناقصة لعرضها للمستخدم.
 */
export class StockError extends Error {
  constructor(shortages) {
    super('insufficient-stock');
    this.name = 'StockError';
    this.shortages = shortages; // [{ id, name, requested, available }]
  }
}

/**
 * إتمام عملية بيع بشكل ذرّي (Atomic):
 * 1. قراءة الكمية الحالية لكل منتج في السلة من قاعدة البيانات
 * 2. التأكد من أن المخزون يكفي
 * 3. إنقاص الكمية من كل منتج
 * 4. حفظ الفاتورة (والدين إن وُجد)
 * إما أن تنجح كل الخطوات معاً أو لا يُحفظ أي شيء.
 */
export const checkoutSale = async ({ items, transactionData, debtData }, userId) => {
  if (!userId) throw new Error('no-user');
  if (!items?.length) throw new Error('empty-cart');

  const now = new Date().toISOString();

  return await runTransaction(db, async (tx) => {
    const refs = items.map(item => doc(db, 'products', item.id));
    const snaps = await Promise.all(refs.map(ref => tx.get(ref)));

    const shortages = [];
    const newQuantities = snaps.map((snap, idx) => {
      const item = items[idx];
      const available = snap.exists() ? Number(snap.data().quantity ?? 0) : 0;
      const requested = Number(item.quantity) || 0;
      if (!snap.exists() || available < requested) {
        shortages.push({ id: item.id, name: item.name, requested, available });
      }
      return available - requested;
    });

    if (shortages.length > 0) throw new StockError(shortages);

    // كل القراءات يجب أن تسبق الكتابات داخل الـ transaction
    refs.forEach((ref, idx) => {
      tx.update(ref, { quantity: newQuantities[idx], updatedAt: now });
    });

    const invoiceRef = doc(collection(db, 'invoices'));
    tx.set(invoiceRef, { ...transactionData, userId, createdAt: now });

    if (debtData) {
      const debtRef = doc(collection(db, 'debts'));
      tx.set(debtRef, { ...debtData, invoiceId: invoiceRef.id, userId, createdAt: now });
    }

    return { invoiceId: invoiceRef.id };
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
