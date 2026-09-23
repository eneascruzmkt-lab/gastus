"use client";

import { useEffect, useRef } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="backdrop:bg-black/50 rounded-2xl p-0 bg-gastus-light-card dark:bg-gastus-card shadow-xl max-w-lg w-full mx-4 md:mx-auto"
    >
      <div className="p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gastus-text mb-4">{title}</h2>
        {children}
      </div>
    </dialog>
  );
}
