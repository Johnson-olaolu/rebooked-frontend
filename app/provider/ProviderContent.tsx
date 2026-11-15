"use client";
import { Toaster } from "~/components/ui/sonner";
import ChatConnection from "./ChatConnection";

const ProviderContent = () => {
  // const { getModal } = useModal();
  // const { getNotification } = useNotification()

  return (
    <>
      <Toaster position="top-right" />
      <ChatConnection />
      {/* {getModal()} */}
      {/* {getNotification()} */}
    </>
  );
};

export default ProviderContent;
