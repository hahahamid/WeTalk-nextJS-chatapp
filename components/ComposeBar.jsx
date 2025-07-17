import { useChatContext } from "@/context/chatContext";
import { useAuth } from "@/context/authContext";
import { db, storage } from "@/firebase/firebase";
import ToastMessage from "@/components/ToastMessage";
import { FaTimes } from "react-icons/fa";
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
import { useState, useRef, useEffect } from "react";
import { IoMdSend } from "react-icons/io";
import { BsMic, BsFillStopFill } from "react-icons/bs"; // Add these icons
import VoiceMessagePlayer from "./VoiceMessagePlayer";

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

  // Voice note state
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const [cursorPosition, setCursorPosition] = useState(0);

  // ---- Voice note handlers ----
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new window.MediaRecorder(stream);
      chunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop()); // Stop the stream
      };
      mediaRecorderRef.current.start();
      setRecording(true);
    } catch (error) {
      toast.error("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const cancelAudio = () => {
    setAudioBlob(null);
    setRecording(false);
  };

  // ---- Send Handler (supports text/img/audio) ----
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

    // Handle photo attachment
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
        },
        (error) => {
          console.error(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
            const msg = { ...newMessage, img: downloadURL };
            await updateDoc(doc(db, "chats", data.chatId), {
              messages: arrayUnion(msg),
            });
          });
        }
      );
      resetFields();
      return;
    }

    // ----- Handle voice note ----
    if (audioBlob) {
      const audioRef = ref(storage, uuid());
      const uploadTask = uploadBytesResumable(audioRef, audioBlob);

      uploadTask.on(
        "state_changed",
        null,
        (error) => {
          console.error(error);
          toast.error("Voice upload failed.");
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          const msg = {
            ...newMessage,
            type: "voice",
            voice: downloadURL,
          };
          await updateDoc(doc(db, "chats", data.chatId), {
            messages: arrayUnion(msg),
          });
        }
      );
      resetFields();
      return;
    }

    // Default: Text only
    await updateDoc(doc(db, "chats", data.chatId), {
      messages: arrayUnion(newMessage),
    });

    // Update userChats as before...
    let msg = { text: inputText };
    if (attachment) msg.img = true;
    await updateDoc(doc(db, "userChats", currentUser.uid), {
      [data.chatId + ".lastMessage"]: msg,
      [data.chatId + ".date"]: serverTimestamp(),
    });
    await updateDoc(doc(db, "userChats", data.user.uid), {
      [data.chatId + ".lastMessage"]: msg,
      [data.chatId + ".date"]: serverTimestamp(),
      [data.chatId + ".chatDeleted"]: deleteField(),
    });

    resetFields();
  };

  const resetFields = () => {
    setInputText("");
    setAttachment(null);
    setAttachmentPreview(null);
    setReplyTo(null);
    setAudioBlob(null);
    setRecording(false);
  };

  const onKeyUp = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      (inputText || attachment || audioBlob)
    ) {
      !editMsg ? handleSend() : handleEdit();
    }
  };

  const handleTyping = (event) => {
    setInputText(event.target.value);
  };

  const [recordingTime, setRecordingTime] = useState(0);

  useEffect(() => {
    let interval;
    if (recording) {
      setRecordingTime(0);
      interval = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } else if (!recording) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [recording]);

  function formatDuration(sec) {
    return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
  }

  // --- UI ---
  return (
    <div className="relative w-full">
      {replyTo && (
        <div className="absolute -top-11 -left-1 w-full md:-top-11 md:w-[99%] bg-gray-700 p-2 flex justify-between items-center rounded-t-md">
          <span className="hidden md:block text-sm text-gray-300">
            Replying to {users[replyTo.sender]?.displayName}:{" "}
            {replyTo.text
              ? replyTo.text.slice(0, 50) +
                (replyTo.text.length > 50 ? "..." : "")
              : "Attachment"}
          </span>
          <span className="md:hidden flex items-center gap-x-2 text-sm text-gray-300">
            {/* Replying to {users[replyTo.sender]?.displayName}:{" "} */}
            <RiReplyFill /> {users[replyTo.sender]?.displayName}:{" "}
            {replyTo.text
              ? replyTo.text.slice(0, 15) +
                (replyTo.text.length > 15 ? "..." : "")
              : "Attachment"}
          </span>
          <button
            onClick={() => setReplyTo(null)}
            className="text-gray-400 hover:text-white"
          >
            <FaTimes />
          </button>
        </div>
      )}

      {recording && (
        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-transparent shadow animate-pulse md:ml-2">
          <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse"></span>
          <span className="font-semibold text-red-600 text-sm">
            Recording...
          </span>
          {/* Optionally show duration */}
          <span className="ml-2 text-xs text-gray-600">
            {formatDuration(recordingTime)}
          </span>
          {/* <button
            className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition"
            onClick={stopRecording}
          >
            Stop
          </button> */}
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
          disabled={!!audioBlob || recording} // Disable typing when audio ready/recording
        />

        {/* AUDIO UI */}
        <div className="flex items-center ml-2">
          {/* If audio ready, show audio preview */}
          {audioBlob && (
            <div className="flex items-center gap-2 mr-2 px-3 md:py-1 rounded-md w-auto">
              <VoiceMessagePlayer
                src={URL.createObjectURL(audioBlob)}
                color="#24a0ed"
                // bubbleClass="bg-gray-900" // You can tweak for your theme
                target={"composebar"}
              />
              <button
                onClick={cancelAudio}
                className="text-red-400 hover:text-red-600 ml-1"
                title="Remove voice note"
              >
                <FaTimes />
              </button>
            </div>
          )}

          {/* Recorder buttons */}
          {!audioBlob && (
            <button
              onClick={recording ? stopRecording : startRecording}
              className={`h-8 w-8 md:h-10 md:w-10 rounded-full shrink-0 flex justify-center items-center transition-colors duration-150 ${
                recording ? "bg-red-600" : "bg-c4"
              }`}
              title={recording ? "Stop recording" : "Record voice"}
            >
              {recording ? (
                <BsFillStopFill size={20} className="text-white" />
              ) : (
                <BsMic size={20} className="text-white" />
              )}
            </button>
          )}
        </div>

        {/* SEND BUTTON */}
        <button
          onClick={!editMsg ? handleSend : handleEdit}
          className={`h-8 w-8 md:h-10 md:w-10 rounded-full md:rounded-xl shrink-0 flex justify-center items-center ${
            inputText.trim().length > 0 || attachment || audioBlob
              ? "bg-c4"
              : ""
          }`}
          disabled={!inputText.trim() && !attachment && !audioBlob}
        >
          <IoMdSend size={20} className="block md:hidden pl-0.5 text-white" />
          <TbSend size={20} className="hidden md:block text-white" />
        </button>
      </div>
    </div>
  );
};

export default Composebar;
