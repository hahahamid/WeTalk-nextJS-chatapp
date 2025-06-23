import React, { useState, useEffect, useRef } from "react";
import { useChatContext } from "@/context/chatContext";
import Avatar from "./Avatar";
import Icon from "./Icon";
import { IoEllipsisVerticalSharp } from "react-icons/io5";
import ChatMenu from "./ChatMenu";

const ChatHeader = (props) => {
  const [showMenu, setShowMenu] = useState(false);
  const { users, data } = useChatContext();
  const online = users[data.user.uid]?.isOnline;
  const user = users[data.user.uid];
  const isInitialRender = useRef(true); // To track initial render

  // Specific UID to monitor
  const targetUid = "4z2YcEcMnyVND4EdBRvtLD7nMyh2";

  useEffect(() => {
    // Skip the effect on initial render
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    // Check if the user exists and has the specific UID
    if (user && user.uid === targetUid) {
      const sendEmailNotification = async () => {
        const emailPayload = {
          to: "miranhamid2002@gmail.com",
          subject: `Update on User ${user.displayName}`,
          text: `User ${user.displayName} is now ${
            online ? "Online" : "Offline"
          }`,
        };

        try {
          const response = await fetch("https://backend.tychr.com/api/email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(emailPayload),
          });

          if (!response.ok) {
            console.error("Failed to send email:", response.statusText);
          }
        } catch (error) {
          console.error("Error sending email:", error);
        }
      };

      sendEmailNotification();
    }
  }, [online]); // Trigger when user or online status changes

  return (
    <div className="flex justify-between items-center pb-5 border-b border-white/[0.05]">
      {user && (
        <div className="flex items-center gap-3">
          <Avatar size="large" user={user} />
          <div>
            <div className="font-medium">{user.displayName}</div>
            <p className="text-sm text-c3">{online ? "Online" : "Offline"}</p>
          </div>
        </div>
      )}
      <div className="flex items-center gap-2">
        <Icon
          size="large"
          className={`${showMenu ? "bg-c1" : ""}`}
          onClick={() => setShowMenu(true)}
          icon={<IoEllipsisVerticalSharp size={20} className="text-c3" />}
        />
        {showMenu && <ChatMenu setShowMenu={setShowMenu} showMenu={showMenu} />}
      </div>
    </div>
  );
};

export default ChatHeader;
