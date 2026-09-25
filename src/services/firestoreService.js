import { db } from '../firebase/config';
import { 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  where
} from 'firebase/firestore';

// --- 1. إدارة المنتجات ---

// الاستماع المباشر للتغييرات في المنتجات (Real-time)
export const subscribeToProducts = (callback) => {
  const productsRef = collection(db, 'products');
  return onSnapshot(productsRef, (snapshot) => {
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(products);
  });
};

// إضافة منتج جديد
export const addProductToDB = async (productData) => {
  return await addDoc(collection(db, 'products'), productData);
};

// تعديل منتج قائم
export const updateProductInDB = async (id, updatedData) => {
  const productDoc = doc(db, 'products', id);
  return await updateDoc(productDoc, updatedData);
};

// حذف منتج
export const deleteProductFromDB = async (id) => {
  const productDoc = doc(db, 'products', id);
  return await deleteDoc(productDoc);
};


// --- 2. إدارة الفواتير ---

// الاستماع المباشر للفواتير
export const subscribeToInvoices = (callback) => {
  const invoicesRef = collection(db, 'invoices');
  return onSnapshot(invoicesRef, (snapshot) => {
    const invoices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(invoices);
  });
};

// حفظ فاتورة جديدة
export const addInvoiceToDB = async (invoiceData) => {
  return await addDoc(collection(db, 'invoices'), invoiceData);
};

// إبطال/إلغاء فاتورة
export const cancelInvoiceInDB = async (id) => {
  const invoiceDoc = doc(db, 'invoices', id);
  return await updateDoc(invoiceDoc, { status: 'cancelled' });
};

// حذف فاتورة نهائياً
export const deleteInvoiceFromDB = async (id) => {
  const invoiceDoc = doc(db, 'invoices', id);
  return await deleteDoc(invoiceDoc);
};


// --- 3. إدارة الديون والعملاء ---

// الاستماع المباشر للديون
export const subscribeToDebts = (callback) => {
  const debtsRef = collection(db, 'debts');
  return onSnapshot(debtsRef, (snapshot) => {
    const debts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(debts);
  });
};

// إضافة عميل دين جديد
export const addCustomerToDB = async (customerData) => {
  return await addDoc(collection(db, 'debts'), customerData);
};

// تحديث بيانات عميل أو حركاته المالية
export const updateCustomerInDB = async (id, updatedData) => {
  const customerDoc = doc(db, 'debts', id);
  return await updateDoc(customerDoc, updatedData);
};

// حذف عميل
export const deleteCustomerFromDB = async (id) => {
  const customerDoc = doc(db, 'debts', id);
  return await deleteDoc(customerDoc);
};


// --- 4. إدارة الأقسام / التصنيفات (جديد) ---

// الاستماع المباشر للتصنيفات من Firestore
export const subscribeToCategories = (callback) => {
  const categoriesRef = collection(db, 'categories');
  return onSnapshot(categoriesRef, (snapshot) => {
    const cats = snapshot.docs.map(doc => doc.data().name);
    // تجميع تصنيف 'الكل' الافتراضي مع الأقسام القادمة من الفايربيس
    const defaultCategories = ['الكل', 'وجبات', 'مشروبات', 'حلويات', 'ساندويش', 'إضافات'];
    const mergedCategories = Array.from(new Set([...defaultCategories, ...cats]));
    callback(mergedCategories);
  });
};

// إضافة تصنيف جديد
export const addCategoryToDB = async (categoryName) => {
  return await addDoc(collection(db, 'categories'), { name: categoryName });
};

// حذف تصنيف من Firestore
export const deleteCategoryFromDB = async (categoryName) => {
  const q = query(collection(db, 'categories'), where("name", "==", categoryName));
  const snapshot = await getDocs(q);
  snapshot.docs.forEach(async (docSnap) => {
    await deleteDoc(doc(db, 'categories', docSnap.id));
  });
};