"use client";

import SharedFileView from "@/features/files/SharedFileView";
import type { SharedFile } from "@/lib/types";

interface Props {
  file: SharedFile;
  pin: string;
}

export default function SecretFileItem({ file, pin }: Props) {
  return (
    <SharedFileView
      kind={file.kind}
      name={file.name}
      size={file.size}
      data={file.data}
      salt={file.salt}
      iv={file.iv}
      ciphertext={file.ciphertext}
      pin={pin}
    />
  );
}