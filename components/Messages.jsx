import React, { useEffect, useState, useRef } from "react";
import Message from "./Message";
import { useChatContext } from "@/context/chatContext";
import { collection, doc, getDoc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { useAuth } from "@/context/authContext";
import {
  DELETED_FOR_ME,
  DELETED_FOR_EVERYONE,
  CHAT_DELETED,
} from "@/utils/constants";
const Messages = () => {
  const [messages, setMessages] = useState([]);
  const { data, setIsTyping } = useChatContext();
  const { currentUser } = useAuth();
  const ref = useRef();

  useEffect(() => {
    const fetchMessagesFromCache = async () => {
      const docRef = doc(db, "chats", data.chatId);
      const docSnap = await getDoc(docRef, { source: 'cache' });

      if (docSnap.exists()) {
        setMessages(docSnap.data().messages);
        setIsTyping(docSnap.data()?.typing?.[data.user.uid] || false);
        scrollToBottom();
      }
    };

    fetchMessagesFromCache();

    const unsub = onSnapshot(doc(db, "chats", data.chatId), (doc) => {
      if (doc.exists()) {
        setMessages(doc.data().messages);
        setIsTyping(doc.data()?.typing?.[data.user.uid] || false);
      }
      setTimeout(() => {
        scrollToBottom();
      }, 0);
    });
    return () => unsub();
  }, [data.chatId]);

  const scrollToBottom = () => {
    const chatContainer = ref.current;
    chatContainer.scrollTop = chatContainer.scrollHeight;
  };
  

  return (
    <div ref={ref} className="grow p-5 overflow-auto scrollbar flex flex-col">
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
