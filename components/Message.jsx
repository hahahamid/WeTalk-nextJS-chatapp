import React, { useEffect, useRef, useState } from "react";
import { useChatContext } from "@/context/chatContext";
import { useAuth } from "@/context/authContext";
import Avatar from "./Avatar";
import { formatDate, wrapEmojisInHtmlTag } from "@/utils/helper";
import { Timestamp, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase";

import { GoKebabHorizontal } from "react-icons/go";
import Menu from "./Menu";
import { DELETED_FOR_ME, DELETED_FOR_EVERYONE } from "@/utils/constants";
import DeleteMessagePopup from "./popup/DeleteMessagePopup";
import ImageViewer from "react-simple-image-viewer";
import Image from "next/image";
import { MdOutlineEmojiEmotions } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";

const Message = ({ message }) => {
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const { users, data, setEditMsg, imageViewer, setImageViewer } =
    useChatContext();
  const { currentUser } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showReactionMenu, setShowReactionMenu] = useState(false);

  const deleteMessage = async (action) => {
    try {
      const messageID = message.id;
      const chatRef = doc(db, "chats", data.chatId);

      // Retrieve the chat document from Firestore
      const chatDoc = await getDoc(chatRef);

      // Create a new "messages" array that excludes the message with the matching ID
      const updatedMessages = chatDoc.data().messages.map((message) => {
        if (message.id === messageID) {
          if (action === DELETED_FOR_ME) {
            message.deletedInfo = {
              [currentUser.uid]: DELETED_FOR_ME,
            };
          }

          if (action === DELETED_FOR_EVERYONE) {
            message.deletedInfo = {
              deletedForEveryone: true,
            };
          }
        }
        return message;
      });

      await updateDoc(chatRef, { messages: updatedMessages });
    } catch (err) {
      console.error(err);
    }
  };

  const deletePopupHandler = () => {
    setShowDeletePopup(true);
    setShowMenu(false);
  };

  const self = message.sender === currentUser.uid; // Check if the message is sent by the current user
  const ref = useRef();
  const reactionMenuRef = useRef(); // Reference for the reaction menu

  const isEdited = message.edited === true;

  const timestamp = new Timestamp(
    message.date?.seconds,
    message.date?.nanoseconds
  );
  const date = timestamp.toDate();

  // Function to handle adding a reaction
  const handleReaction = async (emoji) => {
    try {
      if (self) return; // Prevent reacting to self-messages

      const messageID = message.id;
      const chatRef = doc(db, "chats", data.chatId);

      // Retrieve the chat document from Firestore
      const chatDoc = await getDoc(chatRef);
      const messages = chatDoc.data().messages;

      // Find the message and update its reactions
      const updatedMessages = messages.map((msg) => {
        if (msg.id === messageID) {
          const updatedReactions = { ...msg.reactions };

          // Replace or add the user's reaction
          updatedReactions[currentUser.uid] = emoji;

          msg.reactions = updatedReactions;
        }
        return msg;
      });

      // Update the chat document in Firestore
      await updateDoc(chatRef, { messages: updatedMessages });
    } catch (err) {
      console.error(err);
    } finally {
      setShowReactionMenu(false);
    }
  };

  // Helper function to extract the reaction for the current user
  const getUserReaction = () => {
    const reactions = message.reactions || {};
    return reactions[currentUser.uid];
  };

  // Handle clicks outside the reaction menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        reactionMenuRef.current &&
        !reactionMenuRef.current.contains(event.target)
      ) {
        setShowReactionMenu(false);
      }
    };

    // Add event listener
    document.addEventListener("mousedown", handleClickOutside);

    // Cleanup event listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`mb-5 max-w-[100%] md:max-w-[75%] break-words ${
        self ? "self-end" : ""
      }`}
    >
      {showDeletePopup && (
        <DeleteMessagePopup
          onHide={() => setShowDeletePopup(false)}
          deleteMessage={deleteMessage}
          className="DeleteMessagePopup"
          noHeader={true}
          shortHeight={true}
          self={self}
        />
      )}
      <div
        className={`flex items-end gap-3 mb-1 ${
          self ? "justify-start flex-row-reverse" : ""
        }`}
      >
        <div className="hidden md:block ">
          <Avatar
            size="small"
            user={self ? currentUser : users[data.user.uid]}
            className="mb-4"
          />
        </div>

        <div className="flex items-center relative gap-x-2 md:gap-x-5">
          {self && (
            <div className={`flex items-center relative`}>
              <button
                className="text-c3 hover:text-white cursor-pointer"
                style={{ WebkitTapHighlightColor: "transparent" }}
                onClick={() => setShowMenu(!showMenu)}
              >
                <GoKebabHorizontal />
              </button>

              {showMenu && (
                <Menu
                  self={self}
                  setShowMenu={setShowMenu}
                  showMenu={showMenu}
                  setShowDeletePopup={deletePopupHandler}
                  editMsg={() => setEditMsg(message)}
                />
              )}
            </div>
          )}
          <div
            className={`group flex gap-2 md:gap-4 px-3 py-3 md:px-4 md:py-3 rounded-xl md:rounded-3xl ${
              self ? "rounded-br-md bg-c5" : "rounded-bl-md bg-c1"
            }`}
          >
            {message.text && (
              <div
                className="text-xs md:text-sm"
                dangerouslySetInnerHTML={{
                  __html: wrapEmojisInHtmlTag(message.text),
                }}
              ></div>
            )}

            {/* Display Reactions */}
            {Object.keys(message.reactions || {}).length > 0 && (
              <div
                className={`absolute -bottom-2 ${
                  self ? "bg-c5 border-c2 right-0.5 md:right-1" : "left-0.5 md:left-2 bg-c2 border-c1"
                } rounded-full border-2  p-0.5 md:p-[1px] flex gap-2`}
              >
                {Object.entries(message.reactions).map(([userId, emoji]) => (
                  <div
                    key={userId}
                    className="flex items-center text-[9px] md:text-[11px] text-center rounded-full"
                  >
                    <span>{emoji}</span>
                  </div>
                ))}
              </div>
            )}

            {message.img && (
              <>
                <Image
                  src={message.img}
                  width={250}
                  height={250}
                  className="rounded-3xl max-w-[250px]"
                  alt="image"
                  onClick={() =>
                    setImageViewer({
                      msgId: message.id,
                      url: message.img,
                    })
                  }
                />
                {imageViewer && imageViewer?.msgId === message?.id && (
                  <ImageViewer
                    src={[imageViewer.url]}
                    alt="image"
                    currentIndex={0}
                    disableScroll={false}
                    closeOnClickOutside={true}
                    onClose={() => setImageViewer(null)}
                  />
                )}
              </>
            )}
          </div>

          {/* Reaction Button */}
          {!self && (
            <div className={`flex items-center relative gap-x-1 md:gap-x-2`}>
              <button
                className="text-c3 hover:text-white cursor-pointer"
                style={{ WebkitTapHighlightColor: "transparent" }}
                onClick={() => setShowReactionMenu(!showReactionMenu)}
              >
                <MdOutlineEmojiEmotions />
              </button>

              {/* Reaction Menu with Smooth Animation */}
              <AnimatePresence>
                {showReactionMenu && (
                  <motion.div
                    ref={reactionMenuRef}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    className={`absolute flex bottom-5 mb-1 ${
                      self ? "left-0" : "right-1 md:-right-20"
                    } bg-opacity-50 backdrop-blur-md border border-white border-opacity-50 shadow-md rounded-full px-2 md:px-4 z-10`}
                    style={{
                      boxShadow: "0 0 7px 2px rgba(0, 123, 255, 0.5)", // Glowing border effect
                    }}
                  >
                    <button
                      className="p-1 md:p-2 hover:scale-125 transition duration-200 ease-in-out rounded-full text-lg"
                      style={{ WebkitTapHighlightColor: "transparent" }}
                      onClick={() => handleReaction("👍")}
                    >
                      👍
                    </button>
                    <button
                      className="p-1 md:p-2 hover:scale-125 transition duration-200 ease-in-out rounded-full text-lg"
                      style={{ WebkitTapHighlightColor: "transparent" }}
                      onClick={() => handleReaction("👎")}
                    >
                      👎
                    </button>
                    <button
                      className="p-1 md:p-2 hover:scale-125 transition duration-200 ease-in-out rounded-full text-lg"
                      style={{ WebkitTapHighlightColor: "transparent" }}
                      onClick={() => handleReaction("❤️")}
                    >
                      ❤️
                    </button>
                    <button
                      className="p-1 md:p-2 hover:scale-125 transition duration-200 ease-in-out rounded-full text-lg focus:outline-none"
                      style={{ WebkitTapHighlightColor: "transparent" }}
                      onClick={() => handleReaction("🙏")}
                    >
                      🙏
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className={`flex items-center relative`}>
                <button
                  className="text-c3 hover:text-white cursor-pointer"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                  onClick={() => setShowMenu(!showMenu)}
                >
                  <GoKebabHorizontal />
                </button>

                {showMenu && (
                  <Menu
                    self={self}
                    setShowMenu={setShowMenu}
                    showMenu={showMenu}
                    setShowDeletePopup={deletePopupHandler}
                    editMsg={() => setEditMsg(message)}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <div
        className={`flex items-end mt-2 ${
          self
            ? "justify-start flex-row-reverse mr-1 md:mr-12"
            : "ml-1 md:ml-12"
        }`}
      >
        <div className="text-[10px] md:text-xs text-c3">{formatDate(date)}</div>
      </div>
    </div>
  );
};

export default Message;
