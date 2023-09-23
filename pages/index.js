import { useEffect } from "react";

import { useAuth } from "@/context/authContext";
import { useRouter } from "next/router";

import Chat from "@/components/Chat";
import Sidebar from "@/components/Sidebar";
import LeftNav from "@/components/LeftNav";
import { useChatContext } from "@/context/chatContext";
import Preloader from "@/components/Preloader";
import Head from "next/head";

const Home = () => {

  <Head>
    <title>
      Home
    </title>
  </Head>

  const { currentUser, isLoading } = useAuth();
  const router = useRouter();

  const { data } = useChatContext();

  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.push("/login");
    }
  }, [currentUser, isLoading]);

  return !currentUser ? (
    <Preloader />
  ) : (

    <>
    <Head>
      <title>Home</title>
    </Head>

    <div className="bg-c1 flex h-[100vh]">
      <div className="flex w-full shrink-0">
        <LeftNav />
        <div className="flex bg-c2 grow">
          <Sidebar />
          {data.user && <Chat />}
        </div>
      </div>
    </div>
    </>
  );
};

export default Home;
