import { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged, signOut as authSignOut } from "firebase/auth";
import { getDoc, doc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import { profileColors } from "@/utils/constants";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const clear = async () => {
    try {
      if (currentUser) {
        await updateDoc(doc(db, "users", currentUser.uid), {
          isOnline: false,
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setCurrentUser(null);
      setIsLoading(false);
    }
  };

  const authStateChanged = async (user) => {
    setIsLoading(true);
    if (!user) {
      clear();
      return;
    }

    try {
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        // Create user document if not exists
        const colorIndex = Math.floor(Math.random() * profileColors.length);
        await setDoc(userRef, {
          uid: user.uid,
          displayName: user.displayName, 
          email: user.email,
          photoURL: user.photoURL,
          provider: user.providerData[0]?.providerId || "unknown",
          color: profileColors[colorIndex],
          isOnline: true,
        });

        // Create userChats document
        await setDoc(doc(db, "userChats", user.uid), {});
      } else {
        // Update online status for existing users
        await updateDoc(userRef, { isOnline: true });
      }

      // Fetch updated user data
      const updatedUserDoc = await getDoc(userRef);
      setCurrentUser(updatedUserDoc.data());
    } catch (error) {
      console.error("Auth state error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = () => {
    authSignOut(auth).then(() => clear());
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, authStateChanged);
    return () => unsubscribe();
  }, []);

  return (
    <UserContext.Provider
      value={{ currentUser, setCurrentUser, isLoading, signOut }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useAuth = () => useContext(UserContext);
