import React, { useEffect, useState } from "react";
import Link from "next/link";
import { IoLogoGoogle, IoLogoFacebook } from "react-icons/io";
import { FaUser } from "react-icons/fa";
import { auth } from "@/firebase/firebase";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from "firebase/auth";
import { useAuth } from "@/context/authContext";
const gProvider = new GoogleAuthProvider();
const fProvider = new FacebookAuthProvider();

import { useRouter } from "next/router";
import ToastMessage from "@/components/ToastMessage";
import { toast } from "react-toastify";
import Preloader from "@/components/Preloader";
import Image from "next/image";
import Head from "next/head";

const Login = () => {
  const router = useRouter();
  const { currentUser, isLoading } = useAuth();
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!isLoading && currentUser) {
      // user is logged in
      router.push("/");
    }
  }, [currentUser, isLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = e.target[0].value;
    const password = e.target[1].value;
    try {
      toast.promise(
        async () => {
          //logic
          await signInWithEmailAndPassword(auth, email, password);
        },
        {
          pending: "Logging you in beautiful",
          success: "Logged in",
          error: "Invalid Credentails! Please try again",
        },
        {
          autoClose: 3000,
        }
      );
    } catch (error) {
      console.log(error);
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

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, gProvider);
      console.log("Google Sign-In Success:");
    } catch (error) {
      console.log(error.message);
    }
  };

  const signInWithFacebook = async () => {
    try {
      await signInWithPopup(auth, fProvider);
    } catch (error) {
      console.log(error);
    }
  };

  const resetPassword = async () => {
    try {
      toast.promise(
        async () => {
          //logic
          await sendPasswordResetEmail(auth, email);
        },
        {
          pending: "generating password reset link",
          success: "reset link sent to your email",
          error: "Invalid Credentails! Please try again",
        },
        {
          autoClose: 5000,
        }
      );
    } catch (error) {
      console.error(error);
    }
  };

  return isLoading || (!isLoading && currentUser) ? (
    <Preloader />
  ) : (
    <>
      <Head>
        <title>Login</title>
      </Head>

      <div className="h-[100vh] flex justify-center items-center bg-c1">
        <ToastMessage />

        <div className="flex items-center text-3xl font-bold left-[100px] top-[50px] absolute">
          <div className="flex flex-row items-center gap-4">
            <Image src="/mainlogo.png" alt="loading" width={50} height={50} />
            WeTalk
          </div>
        </div>

        <div className="flex items-center flex-col">
          <div className="text-center">
            <div className="text-4xl font-bold mt-20">
              Log In to your Account
            </div>

            <div className="mt-3 text-c3">
              connect and chat with anyone, anywhere.
            </div>
          </div>

          <div className="flex items-center gap-2 w-full mt-10 mb-5">
            <div
              className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 w-1/2 h-14 rounded-md cursor-pointer p-[1px]"
              onClick={signInWithGoogle}
            >
              <div className="flex items-center justify-center gap-3 text-white font-semibold bg-c1 w-full h-full rounded-md">
                <IoLogoGoogle size={24} />
                <span> Login with Google </span>
              </div>
            </div>

            <div
              className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 w-1/2 h-14 rounded-md cursor-pointer p-[1px]"
              onClick={signInAsGuest}
            > 
            {/* <dialog open className="absolute text-xs -top-10 px-4 py-2 justify-center flex items-center rounded-sm">If you just wanna checkout the app </dialog> */}
              <div className="flex items-center justify-center gap-3 text-white font-semibold bg-c1 w-full h-full rounded-md">
                <FaUser size={24} />
                <span> Sign in as Guest </span>
              </div>
            </div>
          </div>
          <p className="mb-2">If you just wanna test the app, sign in as Guest. ☝️</p>

          <div className="flex items-center gap-1">
            <span className="w-5 h-[3px] bg-c3"></span>
            <span className="text-c3 font-semibold">OR</span>
            <span className="w-5 h-[3px] bg-c3"></span>
          </div>

          <form
            className="flex flex-col items-center gap-3 w-[500px] mt-5"
            onSubmit={handleSubmit}
          >
            <input
              type="email"
              placeholder="Email"
              className="w-full h-14 bg-c5 rounded-xl outline-none border-none px-5 text-c3"
              autocomplete="off"
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full h-14 bg-c5 rounded-xl outline-none border-none px-5 text-c3"
              autocomplete="off"
            />
            <div className="text-right w-full text-c3">
              <span className="cursor-pointer" onClick={resetPassword}>
                Forgot Password?
              </span>
            </div>
            <button className="mt-4 w-full h-14 rounded-xl outline-none text-base font-semibold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
              Login to Your Account
            </button>
          </form>

          <div className="flex justify-center gap-1 text-c3 mt-5">
            <span>Not a member yet?</span>
            <Link
              href="/register"
              className="font-semibold text-white underline underline-offset-2 cursor-pointer"
            >
              Register Now
            </Link>
          </div>
        </div>
      </div>

      {/* <section class=" font-poppins">
        <ToastMessage />

        <div class="relative z-10 flex items-center h-screen py-16 overflow-hidden bg-c0 2xl:py-44">
          <div class="z-0 absolute top-0 left-0 w-full h-full lg:bottom-0 lg:h-auto lg:w-4/12">
            <img
              src="https://i.postimg.cc/XJBZvxHp/first.jpg"
              alt=""
              class="object-cover w-full h-full"
            />
          </div>

          <div className="hidden lg:flex items-center text-3xl font-bold right-[100px] top-[50px] absolute ">
            <div className="flex flex-row items-center gap-4">
              <Image src="/mainlogo.png" alt="loading" width={50} height={50} />
              WeTalk
            </div>
          </div> */}

      {/* <div class="relative max-w-7xl px-4 mx-auto">
            <div class="justify-center max-w-full mx-auto lg:max-w-fit">
              <div class="flex flex-wrap items-center -mx-4">
                <div class="w-full px-4 lg:w-2/5">
                  <div class="z-10 w-full p-10 shadow-md bg-c2 rounded-lg">
                    <h2 class="text-2xl font-bold text-center leading-tight mb-7 md:text-2xl text-white">
                      Log In to your Account
                    </h2> */}

      {/* <div className="flex items-center justify-center gap-3 w-full mt-10 mb-5 "> */}
      {/* <div
                      className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 w-1/2 h-14 rounded-md cursor-pointer p-[1px]"
                      onClick={signInWithGoogle}
                    >
                      <div className="flex items-center justify-center gap-3 text-white font-semibold text-sm bg-c1 w-full h-full rounded-md">
                        <IoLogoGoogle size={24} />
                        <span className="hidden lg:block">
                          Login with Google
                        </span>
                      </div>
                    </div> */}
      {/* <button
                        onClick={signInWithGoogle}
                        class="text-white bg-[#db4a39] hover:bg-[#db4a39]/80 focus:ring-4 focus:outline-none focus:ring-[#4285F4]/50 font-medium rounded-lg text-sm px-5 py-2 text-center inline-flex items-center me-2  w-auto h-12"
                      >
                        <div className="flex items-center justify-center gap-1 text-white font-semibold text-sm w-full h-full rounded-md">
                          
                        <IoLogoGoogle size={30} />
                        <span className="hidden md:block ">
                            Continue with Google
                          </span>
                        </div>
                      </button> */}

      {/* <div
                        className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 w-1/2 h-14 rounded-md cursor-pointer p-[1px]"
                        onClick={signInWithFacebook}
                      >
                        <div className="flex items-center justify-center gap-3 text-white font-semibold text-sm bg-c1 w-full h-full rounded-md">
                          <IoLogoFacebook size={24} />
                          <span className="hidden lg:block">Login with FB</span>
                        </div>
                      </div> */}
      {/* <button
                        onClick={signInWithFacebook}
                        class="text-white bg-[#3b5998] hover:bg-[#3b5998]/90 focus:ring-4 focus:outline-none focus:ring-[#3b5998]/50 font-medium rounded-lg text-sm px-5 py-2 text-center flex items-center me-2 w-auto h-12"
                      >
                        <div className="flex items-center justify-center text-white font-semibold text-sm w-full h-full rounded-md">
                          <IoLogoFacebook size={34} />
                          <span className="hidden md:block">
                            Continue with Facebook
                          </span>
                        </div>
                      </button> */}
      {/* </div> */}

      {/* <form action="" class="mt-4" onSubmit={handleSubmit}>
                      <div>
                        <label
                          for=""
                          class="block text-gray-700 dark:text-gray-300"
                        ></label>
                        <input
                          type="email"
                          class="w-full h-14 bg-c0 rounded-xl outline-none border-none px-5 text-c3"
                          placeholder="Enter your email"
                          autocomplete="off"
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                      <div class="mt-4">
                        <div>
                          <label
                            for=""
                            class="text-gray-700 dark:text-gray-300 "
                          ></label>
                          <div class="relative flex items-center mt-2">
                            <input
                              type="password"
                              placeholder="Password"
                              className="w-full h-14 bg-c0 rounded-xl outline-none border-none px-5 text-c3"
                              autocomplete="off"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="text-right w-full text-c3 mt-2 text-sm lg:text-base ">
                        <span
                          className="cursor-pointer"
                          onClick={resetPassword}
                        >
                          Forgot Password?
                        </span>
                      </div>

                      <button className="mt-4 w-full h-10 md:h-14 rounded-lg md:rounded-xl outline-none text-sm md:text-base font-semibold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 tracking-wider">
                        LOGIN
                      </button>

                      <div class="flex flex-col md:block justify-center items-center mt-4 text-white font-medium">
                        Not yet a member?
                        <a
                          href="#"
                          class="font-semibold text-c4 underline underline-offset-4 cursor-pointer md:pl-2"
                        >
                          <Link href="/register">Register Now</Link>
                        </a>
                      </div>
                    </form>
                  </div>
                </div> */}

      {/* <div class="hidden w-full px-6 mb-16 lg:w-3/5 lg:mb-0 lg:block">
                  <span class="flex items-center justify-center w-20 h-20 mx-auto text-gray-900 bg-yellow-400 rounded-lg mb-9">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="40"
                      height="40"
                      fill="currentColor"
                      class="bi bi-person-circle"
                      viewBox="0 0 16 16"
                    >
                      <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                      <path
                        fill-rule="evenodd"
                        d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z"
                      />
                    </svg>
                  </span>
                  <h2 class="font-bold text-center text-white mb-4 text-6xl">
                    Unlock the world of conversations
                  </h2>
                  <h2 class="font-bold text-center text-white mb-9 text-6xl">
                    Login now!
                  </h2>
                  <p class="text-lg font-medium text-center text-c3 ">
                    connect and chat with anyone, anywhere.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section> */}
    </>
  );
};

export default Login;
