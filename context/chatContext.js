import {
  createContext,
  useContext,
  useState,
  useEffect,
  useReducer,
  useCallback,
} from "react";
import { useAuth } from "@/context/authContext";
import { db } from "@/firebase/firebase";
import {
  arrayUnion,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { uploadToCloudinary } from "@/utils/helper";
import { toast } from "react-toastify";

const ChatContext = createContext();

export const ChatContextProvider = ({ children }) => {
  const { currentUser } = useAuth();

  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [users, setUsers] = useState(true);
  const [inputText, setInputText] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [editMsg, setEditMsg] = useState(null);
  const [isTyping, setIsTyping] = useState(null);
  const [imageViewer, setImageViewer] = useState(null); 
  const [replyTo, setReplyTo] = useState(null); // Added for reply functionality
  const [localMessages, setLocalMessages] = useState([]);

  const addLocalMessage = (msg) =>
    setLocalMessages((prev) => [...prev, msg]);

  const removeLocalMessage = (id) =>
    setLocalMessages((prev) => prev.filter((m) => m.id !== id));

  const updateLocalMessage = (id, updates) =>
    setLocalMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );

  const retryVoiceUpload = useCallback((messageId) => {
    setLocalMessages((prev) => {
      const msg = prev.find((m) => m.id === messageId);
      if (!msg || !msg._blob || msg._uploading) return prev;

      uploadToCloudinary(msg._blob)
        .then(async (downloadURL) => {
          const chatId = msg._chatId;
          const chatDoc = await getDoc(doc(db, "chats", chatId));
          const existing = chatDoc.data()?.messages || [];
          const alreadySent = existing.some((m) => m.id === messageId);
          if (alreadySent) return;

          const { _blob, _uploading, _failed, _chatId, ...cleanMsg } = msg;
          await updateDoc(doc(db, "chats", chatId), {
            messages: arrayUnion({ ...cleanMsg, voice: downloadURL }),
          });
          setTimeout(() => URL.revokeObjectURL(msg.voice), 120000);
        })
        .catch((err) => {
          console.error(err);
          updateLocalMessage(messageId, { _failed: true, _uploading: false });
          toast.error("Voice upload failed. Tap to retry.");
        });

      return prev.map((m) =>
        m.id === messageId ? { ...m, _uploading: true, _failed: false } : m
      );
    });
  }, []);

  const resetFooterStates = () => {
    setInputText("");
    setAttachment(null);
    setAttachmentPreview(null);
    setEditMsg(null);
    setImageViewer(null);
    setReplyTo(null); // Reset reply state
  };

  const INITIAL_STATE = {
    chatId: " ",
    user: null
  };

  const chatReducer = (state, action) => {
    switch (action.type) {
      case "CHANGE_USER":
        return {
          user: action.payload,
          chatId:
            currentUser.uid > action.payload?.uid
              ? currentUser.uid + action.payload.uid
              : action.payload?.uid + currentUser.uid,
        };
      case "EMPTY":
        return INITIAL_STATE;
      default:
        return state;
    }
  };

  const [state, dispatch] = useReducer(chatReducer, INITIAL_STATE);

  return (
    <ChatContext.Provider
      value={{
        chats,
        setChats,
        selectedChat,
        setSelectedChat,
        users,
        setUsers,
        inputText,
        setInputText,
        attachment,
        setAttachment,
        attachmentPreview,
        setAttachmentPreview,
        data: state,
        dispatch,
        editMsg,
        setEditMsg,
        isTyping,
        setIsTyping,
        resetFooterStates,
        imageViewer,
        setImageViewer,
        replyTo,
        setReplyTo,
        localMessages,
        addLocalMessage,
        removeLocalMessage,
        updateLocalMessage,
        retryVoiceUpload,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => useContext(ChatContext);