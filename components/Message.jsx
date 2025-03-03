import React, { useEffect, useRef, useState } from "react";
import { useChatContext } from "@/context/chatContext";
import { useAuth } from "@/context/authContext";
import Avatar from "./Avatar";
import { formatDate, wrapEmojisInHtmlTag } from "@/utils/helper";
import { Timestamp, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { GoChevronDown } from "react-icons/go";
import Icon from "./Icon";
import Menu from "./Menu";
import { DELETED_FOR_ME, DELETED_FOR_EVERYONE } from "@/utils/constants";
import DeleteMessagePopup from "./popup/DeleteMessagePopup";
import ImageViewer from "react-simple-image-viewer";
import Image from "next/image";
import { MdOutlineEmojiEmotions } from "react-icons/md";

const Message = ({ message }) => {
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const { users, data, setEditMsg, imageViewer, setImageViewer } =
    useChatContext();
  const { currentUser } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showReactionMenu, setShowReactionMenu] = useState(false);

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
        <div
          className={`group flex flex-col gap-2 md:gap-4 px-3 py-3 md:px-4 md:py-3 rounded-xl md:rounded-3xl relative ${
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
            <div className="absolute -bottom-2 left-0.5 md:left-2 bg-c2 rounded-full border-2 border-c1 p-0.5 md:p-[1px] flex gap-2">
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

          {/* Reaction Button */}
          {!self && ( // Show reaction button only for other users' messages
            <div
              className={`absolute bottom-1 md:bottom-2.5 ${
                self ? "left-2 md:left-4" : "-right-6 md:-right-7"
              }`}
            >
              <button
                className="text-c3 hover:text-white cursor-pointer"
                onClick={() => setShowReactionMenu(!showReactionMenu)}
              >
                <MdOutlineEmojiEmotions />
              </button>

              {/* Reaction Menu */}
              {showReactionMenu && (
                <div
                  ref={reactionMenuRef} // Attach ref to the reaction menu
                  className={`absolute flex bottom-full mb-1 ${
                    self ? "left-0" : "-left-16 md:-left-20"
                  } bg-opacity-50 backdrop-blur-md border border-gray-300 shadow-md rounded-full px-2 md:px-4 z-10`}
                >
                  <button
                    className="p-1 md:p-2 hover:scale-125 transition duration-200 ease-in-out rounded-full text-lg"
                    onClick={() => handleReaction("👍")}
                  >
                    👍
                  </button>
                  <button
                    className="p-1 md:p-2 hover:scale-125 transition duration-200 ease-in-out rounded-full text-lg"
                    onClick={() => handleReaction("👎")}
                  >
                    👎
                  </button>
                  <button
                    className="p-1 md:p-2 hover:scale-125 transition duration-200 ease-in-out rounded-full text-lg"
                    onClick={() => handleReaction("❤️")}
                  >
                    ❤️
                  </button>
                  <button
                    className="p-1 md:p-2 hover:scale-125 transition duration-200 ease-in-out rounded-full text-lg"
                    onClick={() => handleReaction("🙏")}
                  >
                    🙏
                  </button>
                </div>
              )}
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