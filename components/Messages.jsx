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
  const { data, localMessages, removeLocalMessage } = useChatContext();
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

        if (allMsgs.length !== allMessages.length) {
          setMessages(allMsgs.slice(-100));
        }

        const firestoreIds = new Set(allMsgs.map((m) => m.id));
        localMessages.forEach((lm) => {
          if (firestoreIds.has(lm.id)) removeLocalMessage(lm.id);
        });
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

  const getMessageDate = (msg) => {
    if (!msg?.date) return null;
    if (typeof msg.date.toDate === "function") return msg.date.toDate();
    if (typeof msg.date.seconds === "number") return new Date(msg.date.seconds * 1000);
    return null;
  };

  const isSameDay = (msgA, msgB) => {
    const dateA = getMessageDate(msgA);
    const dateB = getMessageDate(msgB);
    if (!dateA || !dateB) return false;
    return (
      dateA.getFullYear() === dateB.getFullYear() &&
      dateA.getMonth() === dateB.getMonth() &&
      dateA.getDate() === dateB.getDate()
    );
  };

  const formatDayLabel = (msg) => {
    const date = getMessageDate(msg);
    if (!date) return "";
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "2-digit",
    });
  };

  return (
    <div ref={ref} className="grow pt-5 md:pt-0 md:px-5 md:py-5 overflow-auto scrollbar flex flex-col">
      {isLoadingMore && (
        <div className="spinner-container">
          <Spinner />
        </div>
      )}
      {(() => {
        const firestoreFiltered = messages?.filter(
          (m) =>
            m?.deletedInfo?.[currentUser.uid] !== DELETED_FOR_ME &&
            !m?.deletedInfo?.deletedForEveryone &&
            !m?.deleteChatInfo?.[currentUser.uid]
        );
        const firestoreIds = new Set(firestoreFiltered.map((m) => m.id));
        const pendingLocal = localMessages.filter(
          (m) => !firestoreIds.has(m.id)
        );
        const filtered = [...firestoreFiltered, ...pendingLocal];
        return filtered?.map((m, idx) => {
          const prevMsg = idx > 0 ? filtered[idx - 1] : null;
          const nextMsg = idx < filtered.length - 1 ? filtered[idx + 1] : null;
          const showDateLabel = !prevMsg || !isSameDay(prevMsg, m);
          const isFirstInGroup =
            !prevMsg || prevMsg.sender !== m.sender || !isSameDay(prevMsg, m);
          const isLastInGroup =
            !nextMsg || nextMsg.sender !== m.sender || !isSameDay(nextMsg, m);
          return (
            <React.Fragment key={m.id}>
              {showDateLabel && (
                <div className="md:hidden text-c3 text-xs text-center mt-1 mb-2">
                  {formatDayLabel(m)}
                </div>
              )}
              <Message
                message={m}
                isFirstInGroup={isFirstInGroup}
                isLastInGroup={isLastInGroup}
              />
            </React.Fragment>
          );
        });
      })()}
    </div>
  );
};

export default Messages;
