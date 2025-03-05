import React, { useEffect } from "react";
import { IoLogoGoogle, IoLogoFacebook } from "react-icons/io";
import { FaUser } from "react-icons/fa";
import Link from "next/link";
import { auth, db } from "@/firebase/firebase";
import {
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { useAuth } from "@/context/authContext";
const gProvider = new GoogleAuthProvider();
const fProvider = new FacebookAuthProvider();

import ToastMessage from "@/components/ToastMessage";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { profileColors } from "@/utils/constants";
import Preloader from "@/components/Preloader";
import Image from "next/image";
import Head from "next/head";

const Register = () => {
  const router = useRouter();
  const { currentUser, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && currentUser) {
      // user is logged in
      router.push("/");
    }
  }, [currentUser, isLoading]);

  const signInWithGoogle = async () => {
    try {
      const userCredential = await signInWithPopup(auth, gProvider);
      const user = userCredential.user;

      // Check/Create Firestore user
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        const colorIndex = Math.floor(Math.random() * profileColors.length);
        await setDoc(userRef, {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          provider: "google",
          color: profileColors[colorIndex],
          isOnline: true,
        });

        // Create userChats document
        await setDoc(doc(db, "userChats", user.uid), {});
      }

      // Redirect after successful registration
      router.push("/");
    } catch (error) {
      console.error("Google Sign-In Error:", error);
    }
  };

  const signInAsGuest = async () => {
    try {
      toast.promise(
        async () => {
          await signInWithEmailAndPassword(auth, "guest@wetalk.com", "test123");
          console.log("Signed in as guest successfully");
        },
        {
          pending: "Signing in as Guest",
          success: "Logged in",
          error: "Invalid Credentails! Please try again",
        },
        {
          autoClose: 3000,
        }
      );
    } catch (error) {
      console.error("Error signing in as guest:", error.message);
    }
  };

  const signInWithFacebook = async () => {
    try {
      await signInWithPopup(auth, fProvider);
    } catch (error) {
      console.log(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const displayName = e.target[0].value;
    const email = e.target[1].value;
    const password = e.target[2].value;
    const colorIndex = Math.floor(Math.random() * profileColors.length);
    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        displayName,
        email,
        color: profileColors[colorIndex],
      });

      await setDoc(doc(db, "userChats", user.uid), {});

      await updateProfile(user, {
        displayName,
      });

      console.log(user.uid);

      router.push("/");
    } catch (error) {
      console.error(error);
    }
  };

  return isLoading || (!isLoading && currentUser) ? (
    <Preloader />
  ) : (
    <>
      <Head>
        <title> Register </title>
      </Head>

      <ToastMessage />

      <div className="h-screen md:h-[100vh] flex justify-center items-center bg-c1">
        <div className="flex items-center text-3xl font-bold left-[100px] top-[50px] absolute">
          <div className="flex flex-row items-center gap-4">
            <Image src="/mainlogo.png" alt="loading" width={50} height={50} />
            WeTalk
          </div>
        </div>
        <div className="flex items-center flex-col">
          <div className="text-center">
            <div className="text-xl md:text-4xl font-bold mt-20">
              Create a New Account
            </div>
            <div className="mt-3 text-c3 text-sm md:text-base">
              connect and chat with anyone, anywhere
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-2 w-full mt-10 mb-5">
            <div
              className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 w-full md:w-1/2 h-10 md:h-14 rounded-md cursor-pointer p-[1px]"
              onClick={signInWithGoogle}
            >
              <div className="flex items-center justify-center gap-3 text-white font-semibold bg-c1 w-full h-full rounded-md">
                <IoLogoGoogle size={24} />
                <span className="text-sm md:text-base">Login with Google</span>
              </div>
            </div>
            <div
              className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 w-full md:w-1/2 h-10 md:h-14 rounded-md cursor-pointer p-[1px]"
              onClick={signInAsGuest}
            >
              <div className="flex items-center justify-center gap-3 text-white font-semibold bg-c1 w-full h-full rounded-md">
                <FaUser size={24} />
                <span className="text-sm md:text-base"> Sign in as Guest </span>
              </div>
            </div>
          </div>
          <p className="hidden md:block mb-2">
            If you just wanna test the app, sign in as Guest. ☝️
          </p>
          <div className="flex items-center gap-1">
            <span className="w-5 h-[1px] bg-c3"></span>
            <span className="text-c3 font-semibold">OR</span>
            <span className="w-5 h-[1px] bg-c3"></span>
          </div>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col items-center gap-3 w-auto md:w-[500px] mt-5"
          >
            <input
              type="text"
              placeholder="Your Beautiful Name"
              className="w-full h-10 md:h-14 bg-c5 rounded-lg md:rounded-xl outline-none border-none px-5 text-c3 placeholder:text-sm md:placeholder:text-base"
              autoComplete="off"
              required
            />
            <input
              type="email"
              placeholder="Enter your Email"
              className="w-full h-10 md:h-14 bg-c5 rounded-lg md:rounded-xl outline-none border-none px-5 text-c3 placeholder:text-sm md:placeholder:text-base"
              autoComplete="off"
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full h-10 md:h-14 bg-c5 rounded-lg md:rounded-xl outline-none border-none px-5 text-c3 placeholder:text-sm md:placeholder:text-base"
              autoComplete="off"
              required
            />
            <button className="mt-4 w-full h-10 md:h-14 rounded-lg md:rounded-xl outline-none text-base font-semibold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
              Sign Up
            </button>
          </form>
          <div className="flex justify-center gap-1 text-c3 mt-5">
            <span>Already have an account?</span>
            <Link
              href="/login"
              className="font-semibold text-white underline underline-offset-2 cursor-pointer"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;
