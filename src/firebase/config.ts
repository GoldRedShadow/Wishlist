import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

export const firebaseConfig = {
  apiKey: "AIzaSyAUpOMpRg6B_2Y4Rb0XA4mTNHJqT3dE2Fw",
  authDomain: "my-wishlist-for-me.firebaseapp.com",
  projectId: "my-wishlist-for-me",
  storageBucket: "my-wishlist-for-me.firebasestorage.app",
  messagingSenderId: "448210162982",
  appId: "1:448210162982:web:320346981a2b498dd81de7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

/*
SECURITY RULES (To be pasted into Firebase Console):

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Wishlists: Anyone can read, only creator can write.
    match /wishlists/{wishlistId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.creatorId;
      
      // Wishes: Anyone can read, only creator can write.
      match /wishes/{wishId} {
        allow read: if true;
        allow create, update, delete: if request.auth != null && request.auth.uid == get(/databases/$(database)/documents/wishlists/$(wishlistId)).data.creatorId;
      }
      
      // Reservations: Creator CANNOT read. Guests can read/write.
      match /reservations/{wishId} {
        allow read, write: if request.auth == null || request.auth.uid != get(/databases/$(database)/documents/wishlists/$(wishlistId)).data.creatorId;
      }
    }
  }
}
*/
