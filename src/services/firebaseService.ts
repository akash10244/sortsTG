/**
 * firebaseService.ts
 *
 * Initializes Firebase and wraps Firestore operations for sortsTG.
 * Scopes data under users/{userId} for data privacy.
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  writeBatch,
  where,
} from 'firebase/firestore';
import { FIREBASE_CONFIG } from '../config';
import type { Contact, AppConfig, ContactRequest } from '../types';

// Initialize Firebase
export const app = initializeApp(FIREBASE_CONFIG);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleAuthProvider = new GoogleAuthProvider();

// ─── Firestore CRUD operations ───────────────────────────────────────────────

/**
 * Subscribe to the user's contacts collection in real-time.
 */
export function subscribeToContacts(
  userId: string,
  onUpdate: (contacts: Contact[]) => void,
  onError: (err: any) => void
) {
  const contactsRef = collection(db, 'users', userId, 'contacts');
  const q = query(contactsRef, orderBy('name', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const contacts: Contact[] = [];
      snapshot.forEach((doc) => {
        contacts.push(doc.data() as Contact);
      });
      onUpdate(contacts);
    },
    onError
  );
}

/**
 * Save (create or update) a contact document in Firestore.
 * If the contact is pooled, automatically updates the sanitized public version.
 */
export async function saveContactDoc(userId: string, contact: Contact): Promise<void> {
  const docRef = doc(db, 'users', userId, 'contacts', contact.id);
  await setDoc(docRef, contact);

  if (contact.isPooled) {
    const pooledRef = doc(db, 'pooledContacts', `${userId}_${contact.id}`);
    const safeCopy = {
      id: `${userId}_${contact.id}`,
      originalContactId: contact.id,
      ownerId: userId,
      ownerEmail: auth.currentUser?.email || 'Unknown',
      ownerName: auth.currentUser?.displayName || auth.currentUser?.email || 'Anonymous',
      name: contact.name ?? '',
      age: contact.age ?? null,
      ageType: contact.ageType ?? '',
      location: contact.location ?? '',
      imageUrls: contact.imageUrls ?? [],
      imageKitIds: contact.imageKitIds ?? [],
      prices: contact.prices ?? [],
      priceType: contact.priceType ?? 'budget',
      isActive: contact.isActive ?? true,
      isLessInterested: contact.isLessInterested ?? false,
      didntExplorex: contact.didntExplorex ?? false,
      createdAt: contact.createdAt ?? new Date().toISOString(),
      updatedAt: contact.updatedAt ?? new Date().toISOString(),
    };
    await setDoc(pooledRef, safeCopy, { merge: true });
  }
}

/**
 * Delete a contact document from Firestore.
 * Also deletes any public pooled document associated with this contact.
 */
export async function deleteContactDoc(userId: string, contactId: string): Promise<void> {
  const docRef = doc(db, 'users', userId, 'contacts', contactId);
  await deleteDoc(docRef);

  const pooledRef = doc(db, 'pooledContacts', `${userId}_${contactId}`);
  await deleteDoc(pooledRef);
}

/**
 * Pool multiple contacts: sets isPooled = true privately, and writes sanitized copies publicly in chunks.
 */
export async function poolContactsDocs(userId: string, contactsToPool: Contact[]): Promise<void> {
  const ownerEmail = auth.currentUser?.email || 'Unknown';
  const ownerName = auth.currentUser?.displayName || auth.currentUser?.email || 'Anonymous';

  const chunkSize = 200; // 200 contacts = 400 operations (limit is 500)
  for (let i = 0; i < contactsToPool.length; i += chunkSize) {
    const chunk = contactsToPool.slice(i, i + chunkSize);
    const batch = writeBatch(db);

    chunk.forEach((contact) => {
      // 1. Update private contact
      const privateRef = doc(db, 'users', userId, 'contacts', contact.id);
      batch.update(privateRef, { isPooled: true });

      // 2. Write public safe copy
      const pooledRef = doc(db, 'pooledContacts', `${userId}_${contact.id}`);
      const safeCopy = {
        id: `${userId}_${contact.id}`,
        originalContactId: contact.id,
        ownerId: userId,
        ownerEmail,
        ownerName,
        name: contact.name ?? '',
        age: contact.age ?? null,
        ageType: contact.ageType ?? '',
        location: contact.location ?? '',
        imageUrls: contact.imageUrls ?? [],
        imageKitIds: contact.imageKitIds ?? [],
        prices: contact.prices ?? [],
        priceType: contact.priceType ?? 'budget',
        isActive: contact.isActive ?? true,
        isLessInterested: contact.isLessInterested ?? false,
        didntExplorex: contact.didntExplorex ?? false,
        createdAt: contact.createdAt ?? new Date().toISOString(),
        updatedAt: contact.updatedAt ?? new Date().toISOString(),
        pooledAt: new Date().toISOString(),
      };
      batch.set(pooledRef, safeCopy);
    });

    await batch.commit();
  }
}

/**
 * De-pool multiple contacts: sets isPooled = false privately, and deletes public copies in chunks.
 */
export async function depoolContactsDocs(userId: string, contactIds: string[]): Promise<void> {
  const chunkSize = 200; // 200 contacts = 400 operations (limit is 500)
  for (let i = 0; i < contactIds.length; i += chunkSize) {
    const chunk = contactIds.slice(i, i + chunkSize);
    const batch = writeBatch(db);

    chunk.forEach((contactId) => {
      // 1. Update private contact
      const privateRef = doc(db, 'users', userId, 'contacts', contactId);
      batch.update(privateRef, { isPooled: false });

      // 2. Delete public copy
      const pooledRef = doc(db, 'pooledContacts', `${userId}_${contactId}`);
      batch.delete(pooledRef);
    });

    await batch.commit();
  }
}

/**
 * Fetch config settings for a specific user.
 */
export async function fetchConfigDoc(userId: string): Promise<AppConfig | null> {
  const docRef = doc(db, 'users', userId, 'config', 'settings');
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return snapshot.data() as AppConfig;
}

/**
 * Save configuration settings for a specific user.
 */
export async function saveConfigDoc(userId: string, config: AppConfig): Promise<void> {
  const docRef = doc(db, 'users', userId, 'config', 'settings');
  await setDoc(docRef, config);
}

/**
 * Fetch all pooled contacts from the public 'pooledContacts' collection.
 */
export async function fetchPooledContacts(): Promise<Contact[]> {
  const colRef = collection(db, 'pooledContacts');
  const snapshot = await getDocs(colRef);
  const pooledList: Contact[] = [];
  snapshot.forEach((docSnap) => {
    pooledList.push(docSnap.data() as Contact);
  });
  return pooledList;
}

/**
 * Submits a contact details request to the root 'contactRequests' collection.
 * Uses predictable ID: requesterId_originalContactId to align with security rules lookup.
 */
export async function createContactRequest(requestDraft: Omit<ContactRequest, 'id' | 'createdAt' | 'status'>): Promise<void> {
  const reqId = `${requestDraft.requesterId}_${requestDraft.originalContactId}`;
  const docRef = doc(db, 'contactRequests', reqId);
  const newRequest: ContactRequest = {
    ...requestDraft,
    id: reqId,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  await setDoc(docRef, newRequest);
}

/**
 * Subscribe to incoming contact requests where the active user is the owner.
 */
export function subscribeToIncomingRequests(
  userId: string,
  onUpdate: (requests: ContactRequest[]) => void,
  onError: (err: any) => void
) {
  const colRef = collection(db, 'contactRequests');
  const q = query(colRef, where('ownerId', '==', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const requests: ContactRequest[] = [];
      snapshot.forEach((doc) => {
        requests.push(doc.data() as ContactRequest);
      });
      onUpdate(requests);
    },
    onError
  );
}

/**
 * Subscribe to sent contact requests where the active user is the requester.
 */
export function subscribeToSentRequests(
  userId: string,
  onUpdate: (requests: ContactRequest[]) => void,
  onError: (err: any) => void
) {
  const colRef = collection(db, 'contactRequests');
  const q = query(colRef, where('requesterId', '==', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const requests: ContactRequest[] = [];
      snapshot.forEach((doc) => {
        requests.push(doc.data() as ContactRequest);
      });
      onUpdate(requests);
    },
    onError
  );
}

/**
 * Update request status (e.g. approve or reject).
 */
export async function updateRequestStatus(requestId: string, status: 'approved' | 'rejected'): Promise<void> {
  const docRef = doc(db, 'contactRequests', requestId);
  await setDoc(docRef, { status }, { merge: true });
}

/**
 * Fetch a single private contact doc from another user's subcollection.
 * Only works if current user has an approved request under firestore security rules.
 */
export async function fetchPrivateContactDoc(ownerId: string, contactId: string): Promise<Contact | null> {
  const docRef = doc(db, 'users', ownerId, 'contacts', contactId);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return snapshot.data() as Contact;
}
