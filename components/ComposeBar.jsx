import { useChatContext } from "@/context/chatContext";
import { useAuth } from "@/context/authContext";
import { db, storage } from "@/firebase/firebase";
import ToastMessage from "@/components/ToastMessage";

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
  } = useChatContext();
  const [cursorPosition, setCursorPosition] = useState(0);

  const handleSend = async () => {
    if (attachment) {
      const storageRef = ref(storage, uuid());
      const uploadTask = uploadBytesResumable(storageRef, attachment);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // Observe state change events such as progress, pause, and resume
          // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;

          if (progress === 100) {
            toast.success("Uploaded successfully", {
              autoClose: 3000, // Adjust as needed
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
            await updateDoc(doc(db, "chats", data.chatId), {
              messages: arrayUnion({
                id: uuid(),
                text: inputText,
                sender: currentUser.uid,
                date: Timestamp.now(),
                img: downloadURL,
                read: false,
              }),
            });
          });
        }
      );
    } else {
      await updateDoc(doc(db, "chats", data.chatId), {
        messages: arrayUnion({
          id: uuid(),
          text: inputText,
          sender: currentUser.uid,
          date: Timestamp.now(),
          read: false,
        }),
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
  };

  const handleEdit = async () => {
    try {
      const messageID = editMsg.id;
      const chatRef = doc(db, "chats", data.chatId);

      // Retrieve the chat document from Firestore
      const chatDoc = await getDoc(chatRef);

      if (attachment) {
        const storageRef = ref(storage, uuid());
        const uploadTask = uploadBytesResumable(storageRef, attachment);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            // Observe state change events such as progress, pause, and resume
            // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
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
                // Create a new "messages" array that excludes the message with the matching ID
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
        // Create a new "messages" array that excludes the message with the matching ID
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

    // await updateDoc(doc(db, "chats", data.chatId), {
    //   [`typing.${currentUser.uid}`]: true,
    // });

    // If the user was previously typing, clear the timeout
    // if (typingTimeout) {
    //   clearTimeout(typingTimeout);
    // }

    // // Set a new timeout for 1.5 seconds after the last keystroke
    // typingTimeout = setTimeout(async () => {
    //   // Send a typing indicator to other users indicating that this user has stopped typing
    //   // console.log("User has stopped typing");

    //   await updateDoc(doc(db, "chats", data.chatId), {
    //     [`typing.${currentUser.uid}`]: false,
    //   });

    //   // Reset the timeout
    //   typingTimeout = null;
    // }, 100);
  };

  return (
    <div className="flex items-center md:gap-2 grow">
      <ToastMessage />
      <input
        type="text"
        className="resize-none w-full h-10 outline-0 px-2 py-2 text-white bg-transparent text-sm placeholder:text-sm md:placeholder:text-base placeholder:text-c3 outline-none md:text-base"
        placeholder="Type a message"
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
  );
};

export default Composebar;
