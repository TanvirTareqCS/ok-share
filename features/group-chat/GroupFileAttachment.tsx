"use client";

import SharedFileView from "@/features/files/SharedFileView";
import type { FileAttachment } from "@/lib/types";

interface Props {
  attachment: FileAttachment;
  channelKey: CryptoKey | null;
}

export default function GroupFileAttachment({ attachment, channelKey }: Props) {
  return (
    <SharedFileView
      kind={attachment.kind}
      name={attachment.name}
      size={attachment.size}
      iv={attachment.iv}
      ciphertext={attachment.ciphertext}
      channelKey={channelKey}
    />
  );
}