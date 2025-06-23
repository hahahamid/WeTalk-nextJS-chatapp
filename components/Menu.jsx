import React, { useEffect, useRef } from "react";
import ClickAwayListener from "react-click-away-listener";

const Menu = ({ self, setShowMenu, showMenu, setShowDeletePopup, editMsg, replyTo }) => {
  const ref = useRef();

  useEffect(() => {
    ref?.current?.scrollIntoViewIfNeeded();
  }, [showMenu]);

  const handleClickAway = () => {
    setShowMenu(false);
  };

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <div
        ref={ref}
        className={`w-auto md:w-[200px] text-xs md:text-base absolute top-8 bg-c0 z-10 rounded-md overflow-hidden ${
          self ? "left-0" : "right-0"
        }`}
      >
        <ul className="flex flex-col md:py-2">
          <li
            className="flex items-center py-3 px-2 md:px-5 hover:bg-black cursor-pointer whitespace-nowrap"
            onClick={(e) => {
              e.stopPropagation();
              replyTo();
              setShowMenu(false);
            }}
          >
            Reply
          </li>
          {self && (
            <li
              className="flex items-center py-3 px-2 md:px-5 hover:bg-black cursor-pointer whitespace-nowrap"
              onClick={(e) => {
                e.stopPropagation();
                editMsg();
                setShowMenu(false);
              }}
            >
              Edit message
            </li>
          )}
          <li
            className="flex items-center py-3 px-2 md:px-5 hover:bg-black cursor-pointer whitespace-nowrap"
            onClick={(e) => {
              e.stopPropagation();
              setShowDeletePopup();
            }}
          >
            Delete message
          </li>
        </ul>
      </div>
    </ClickAwayListener>
  );
};

export default Menu;