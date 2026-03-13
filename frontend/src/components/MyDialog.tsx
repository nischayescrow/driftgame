import Dialog from "@mui/material/Dialog";
import { type ReactNode } from "react";
import { IoMdClose } from "react-icons/io";

const MyDialog = ({
  children,
  open,
  onClose,
  headerText,
}: {
  children: ReactNode;
  open: boolean;
  onClose: () => void;
  headerText: string;
}) => {
  return (
    <Dialog
      onClose={onClose}
      open={open}
      sx={{
        "& .MuiDialog-paper": {
          maxHeight: "calc(100vh-64px)",
          overflowY: "hidden",
        },
      }}
    >
      <div className="relative max-h-full overflow-y-auto flex flex-col hideScrollBar">
        {/* header */}
        <div
          className={`sticky top-0 left-0 right-0 z-10 bg-primary text-white flex justify-between items-center p-4`}
        >
          <p className="font-semibold text-lg">{headerText}</p>
          <button
            type="button"
            className="p-2 text-xl cursor-pointer"
            onClick={onClose}
          >
            <IoMdClose />
          </button>
        </div>

        {children}
      </div>
    </Dialog>
  );
};

export default MyDialog;
