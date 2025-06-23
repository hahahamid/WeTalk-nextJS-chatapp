import { useChatContext } from "@/context/chatContext";
import { useAuth } from "@/context/authContext";
import { db, storage } from "@/firebase/firebase";
import ToastMessage from "@/components/ToastMessage";
import { FaTimes } from "react-icons/fa"; // Import the "x" icon
import { RiReplyFill } from "react-icons/ri";

import { v4 as uuid } from "uuid";
import {
  Timestamp,
  arrayUnion,
  deleteField,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";

import { TbSend } from "react-icons/tb";
import { toast } from "react-toastify";
import { useState } from "react";
import { IoMdSend } from "react-icons/io";

let typingTimeout = null;

const Composebar = () => {
  const { currentUser } = useAuth();
  const {
    inputText,
    setInputText,
    attachment,
    setAttachment,
    setAttachmentPreview,
    data,
    editMsg,
    setEditMsg,
    replyTo,
    setReplyTo,
    users,
  } = useChatContext();
  const [cursorPosition, setCursorPosition] = useState(0);

  const handleSend = async () => {
    const newMessage = {
      id: uuid(),
      text: inputText,
      sender: currentUser.uid,
      date: Timestamp.now(),
      read: false,
    };

    if (replyTo) {
      newMessage.quotedMessage = {
        text: replyTo.text,
        sender: replyTo.sender,
      };
    }

    if (attachment) {
      const storageRef = ref(storage, uuid());
      const uploadTask = uploadBytesResumable(storageRef, attachment);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;

          if (progress === 100) {
            toast.success("Uploaded successfully", {
              autoClose: 3000,
            });
          } else {
            toast.info("Uploading...", {
              autoClose: 1000,
            });
          }

          console.log("Upload is " + progress + "% done");
          switch (snapshot.state) {
            case "paused":
              console.log("Upload is paused");
              break;
            case "running":
              console.log("Upload is running");
              break;
          }
        },
        (error) => {
          console.error(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
            const messageWithImg = { ...newMessage, img: downloadURL };
            await updateDoc(doc(db, "chats", data.chatId), {
              messages: arrayUnion(messageWithImg),
            });
          });
        }
      );
    } else {
      await updateDoc(doc(db, "chats", data.chatId), {
        messages: arrayUnion(newMessage),
      });
    }

    let msg = { text: inputText };
    if (attachment) {
      msg.img = true;
    }

    await updateDoc(doc(db, "userChats", currentUser.uid), {
      [data.chatId + ".lastMessage"]: msg,
      [data.chatId + ".date"]: serverTimestamp(),
    });

    await updateDoc(doc(db, "userChats", data.user.uid), {
      [data.chatId + ".lastMessage"]: msg,
      [data.chatId + ".date"]: serverTimestamp(),
      [data.chatId + ".chatDeleted"]: deleteField(),
    });

    setInputText("");
    setAttachment(null);
    setAttachmentPreview(null);
    setReplyTo(null); // Reset reply state after sending
  };

  const handleEdit = async () => {
    try {
      const messageID = editMsg.id;
      const chatRef = doc(db, "chats", data.chatId);

      const chatDoc = await getDoc(chatRef);

      if (attachment) {
        const storageRef = ref(storage, uuid());
        const uploadTask = uploadBytesResumable(storageRef, attachment);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log("Upload is " + progress + "% done");
            switch (snapshot.state) {
              case "paused":
                console.log("Upload is paused");
                break;
              case "running":
                console.log("Upload is running");
                break;
            }
          },
          (error) => {
            console.error(error);
          },
          () => {
            getDownloadURL(uploadTask.snapshot.ref).then(
              async (downloadURL) => {
                let updatedMessages = chatDoc.data().messages.map((message) => {
                  if (message.id === messageID) {
                    message.text = inputText;
                    message.img = downloadURL;
                    message.alt = downloadURL;
                  }
                  return message;
                });

                await updateDoc(chatRef, {
                  messages: updatedMessages,
                });
              }
            );
          }
        );
      } else {
        let updatedMessages = chatDoc.data().messages.map((message) => {
          if (message.id === messageID) {
            message.text = inputText;
            message.edited = true;
          }
          return message;
        });
        await updateDoc(chatRef, { messages: updatedMessages });
      }

      setInputText("");
      setAttachment(null);
      setAttachmentPreview(null);
      setEditMsg(null);
    } catch (err) {
      console.error(err);
    }
  };

  const onKeyUp = (event) => {
    if (event.key === "Enter" && !event.shiftKey && (inputText || attachment)) {
      !editMsg ? handleSend() : handleEdit();
    }
  };

  const handleTyping = async (event) => {
    setInputText(event.target.value);
  };

  return (
    <div className="relative w-full">
      {replyTo && (
        <div className="absolute -top-11 -left-1 w-full md:-top-11 md:w-[99%] bg-gray-700 p-2 flex justify-between items-center rounded-t-md">
          <span className="hidden md:block text-sm text-gray-300">
            Replying to {users[replyTo.sender]?.displayName}:{" "}
            {replyTo.text
              ? replyTo.text.slice(0, 50) +
                (replyTo.text.length > 50 ? "..." : "")
              : "Image"}
          </span>
          <span className="md:hidden flex items-center gap-x-2 text-sm text-gray-300">
            {/* Replying to {users[replyTo.sender]?.displayName}:{" "} */}
            <RiReplyFill /> {users[replyTo.sender]?.displayName}:{" "}
            {replyTo.text
              ? replyTo.text.slice(0, 15) +
                (replyTo.text.length > 15 ? "..." : "")
              : "Image"}
          </span>
          <button
            onClick={() => setReplyTo(null)}
            className="text-gray-400 hover:text-white"
          >
            <FaTimes />
          </button>
        </div>
      )}
      <div className="flex items-center md:gap-2 grow">
        <ToastMessage />
        <input
          type="text"
          className="resize-none w-full h-10 outline-0 px-2 py-2 text-white bg-transparent text-sm placeholder:text-sm md:placeholder:text-base placeholder:text-c3 outline-none md:text-base"
          placeholder={replyTo ? "Type your reply..." : "Type a message"}
          value={inputText}
          onChange={handleTyping}
          onKeyUp={onKeyUp}
        />
        <button
          onClick={!editMsg ? handleSend : handleEdit}
          className={`h-8 w-8 md:h-10 md:w-10 rounded-full md:rounded-xl shrink-0 flex justify-center items-center ${
            inputText.trim().length > 0 ? "bg-c4" : ""
          } ${attachment ? "bg-c4" : ""}`}
          disabled={!inputText.trim() && !attachment}
        >
          <IoMdSend size={20} className="block md:hidden pl-0.5 text-white" />
          <TbSend size={20} className="hidden md:block text-white" />
        </button>
      </div>
    </div>
  );
};

export default Composebar;
