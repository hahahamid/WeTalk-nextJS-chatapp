import React, { useEffect, useState, useRef } from "react";
import Message from "./Message";
import { useChatContext } from "@/context/chatContext";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { useAuth } from "@/context/authContext";
import {
  DELETED_FOR_ME,
  DELETED_FOR_EVERYONE,
  CHAT_DELETED,
} from "@/utils/constants";
import Spinner from "./Spinner";

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [allMessages, setAllMessages] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { data } = useChatContext();
  const { currentUser } = useAuth();
  const ref = useRef();

  useEffect(() => {
    const fetchMessagesFromCache = async () => {
      const docRef = doc(db, "chats", data.chatId);
      const docSnap = await getDoc(docRef, { source: "cache" });

      if (docSnap.exists()) {
        const allMsgs = docSnap.data().messages || [];
        setAllMessages(allMsgs);
        setMessages(allMsgs.slice(-100)); // Load last 50 messages
        scrollToBottom();
      }
    };

    fetchMessagesFromCache();

    const unsub = onSnapshot(doc(db, "chats", data.chatId), (doc) => {
      if (doc.exists()) {
        const allMsgs = doc.data().messages || [];
        setAllMessages(allMsgs);

        // Update messages only if new messages are added
        if (allMsgs.length !== allMessages.length) {
          setMessages(allMsgs.slice(-100));
        }
      }
      setTimeout(() => {
        scrollToBottom();
      }, 0);
    });
    return () => unsub();
  }, [data.chatId]);

  useEffect(() => {
    const chatContainer = ref.current;

    const handleScroll = () => {
      if (
        chatContainer.scrollTop === 0 &&
        messages.length === 100 &&
        allMessages.length > 100 &&
        !isLoadingMore
      ) {
        setIsLoadingMore(true);
        setTimeout(() => {
          const scrollHeightBefore = chatContainer.scrollHeight;
          const remainingMessages = allMessages.slice(
            0,
            allMessages.length - 100
          );

          setMessages((prevMessages) => [
            ...remainingMessages,
            ...prevMessages,
          ]);

          setTimeout(() => {
            const scrollHeightAfter = chatContainer.scrollHeight;
            chatContainer.scrollTop = scrollHeightAfter - scrollHeightBefore;
            setIsLoadingMore(false);
          }, 0);
        }, 500); 
      }
    };

    chatContainer.addEventListener("scroll", handleScroll);
    return () => {
      chatContainer.removeEventListener("scroll", handleScroll);
    };
  }, [messages, allMessages, isLoadingMore]);

  const scrollToBottom = () => {
    const chatContainer = ref.current;
    chatContainer.scrollTop = chatContainer.scrollHeight;
  };

  return (
    <div ref={ref} className="grow md:px-5 md:py-5 overflow-auto scrollbar flex flex-col">
      {isLoadingMore && (
        <div className="spinner-container">
          <Spinner />
        </div>
      )}
      {messages
        ?.filter(
          (m) =>
            m?.deletedInfo?.[currentUser.uid] !== DELETED_FOR_ME &&
            !m?.deletedInfo?.deletedForEveryone &&
            !m?.deleteChatInfo?.[currentUser.uid]
        )
        ?.map((m) => {
          return <Message message={m} key={m.id} />;
        })}
    </div>
  );
};

export default Messages;
