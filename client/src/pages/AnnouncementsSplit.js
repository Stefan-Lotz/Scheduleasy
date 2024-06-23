import React from "react";
import { useContext } from "react";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { PaperAirplaneIcon as PaperAirplaneOutline } from "@heroicons/react/24/outline";
import { PaperAirplaneIcon as PaperAirplaneSolid } from "@heroicons/react/24/solid";
import UserMessage from "../UserMessage";
import { UserContext } from "../UserContext";

const AnnouncementsSplit = ({
  scheduleInfo,
  handleMessageSubmit,
  newMessage,
  setNewMessage,
  messageContainerRef,
  sendIsHovered,
  setSendIsHovered,
}) => {
  const { userInfo } = useContext(UserContext);

  return (
    <div className="relative h-full flex flex-col">
      <div className="flex justify-center">
        <ExclamationCircleIcon className="w-6 h-6 my-2 hover:animate-spin" />
      </div>
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden mb-2"
        ref={messageContainerRef}
      >
        <div className="flex flex-col h-full justify-between">
          <div className="grid px-2">
            {scheduleInfo.messages &&
              scheduleInfo.messages.map((message) => (
                <UserMessage key={message._id} message={message} />
              ))}
          </div>
          {userInfo.id === scheduleInfo.author._id && (
            <form
              onSubmit={handleMessageSubmit}
              className="px-2 flex gap-2 items-center"
            >
              <input
                value={newMessage}
                type="text"
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Send an announcement..."
                className="w-full rounded-3xl border-gray-300 resize-y overflow-y-auto mb-0.5"
              />
              <button
                type="button"
                onClick={handleMessageSubmit}
                className="bg-mint p-1 text-white rounded-full flex hover:bg-slate"
                onMouseEnter={() => setSendIsHovered(true)}
                onMouseLeave={() => setSendIsHovered(false)}
              >
                {sendIsHovered ? (
                  <PaperAirplaneSolid className="size-6 -rotate-90 m-auto" />
                ) : (
                  <PaperAirplaneOutline className="size-6 -rotate-90 m-auto" />
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementsSplit;