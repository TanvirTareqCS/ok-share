"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { classifyFileName } from "@/lib/crypto/fileCipher";
import type { AttachmentDraft } from "@/lib/types";
import PasscodePanel from "./PasscodePanel";
import PastebinEditor from "./PastebinEditor";
import PastebinFilePicker from "./PastebinFilePicker";
import PastebinOptions from "./PastebinOptions";
import ShareLinkResult from "./ShareLinkResult";
import { usePastebinSecret } from "./usePastebinSecret";

interface Props {
  text: string;
  setText: React.Dispatch<React.SetStateAction<string>>;
  requirePasscode: boolean;
  setRequirePasscode: (value: boolean) => void;
  setIsFlying: (value: boolean) => void;
  onOpenDictation: () => void;
}

function createAttachment(files: File[], index: number): AttachmentDraft {
  const file = files[index];
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: file.name,
    size: file.size,
    kind: classifyFileName(file.name),
    file,
  };
}

export default function PastebinWorkspace({
  text,
  setText,
  requirePasscode,
  setRequirePasscode,
  setIsFlying,
  onOpenDictation,
}: Props) {
  const [passcode, setPasscode] = useState("");
  const [maxViews, setMaxViews] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<AttachmentDraft[]>([]);

  const draft = usePastebinSecret({
    text,
    setText,
    passcode,
    maxViews,
    requirePasscode,
    files: attachedFiles,
    setIsFlying,
  });

  const handleAddFiles = (picked: File[]) => {
    setAttachedFiles((previous) => [
      ...previous,
      ...picked.map((_, index) => createAttachment(picked, index)),
    ]);
  };

  const handleCreateAnother = () => {
    draft.clearLink();
    setText("");
    setPasscode("");
    setMaxViews("");
    setRequirePasscode(false);
    setAttachedFiles([]);
  };

  if (draft.shareableLink) {
    return <ShareLinkResult shareableLink={draft.shareableLink} onCreateAnother={handleCreateAnother} />;
  }

  return (
    <>
      <PastebinEditor
        text={text}
        isMasking={draft.isMasking}
        onTextChange={setText}
        onOpenDictation={onOpenDictation}
      />

      <PastebinFilePicker
        files={attachedFiles}
        isLocked={draft.isMasking || draft.isLoading}
        onAddFiles={handleAddFiles}
        onRemove={(id) =>
          setAttachedFiles((previous) => previous.filter((file) => file.id !== id))
        }
      />

      <AnimatePresence>
        {requirePasscode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden mb-4"
          >
            <PasscodePanel passcode={passcode} onPasscodeChange={setPasscode} />
          </motion.div>
        )}
      </AnimatePresence>

      <PastebinOptions
        requirePasscode={requirePasscode}
        maxViews={maxViews}
        isLoading={draft.isLoading}
        onRequirePasscodeChange={setRequirePasscode}
        onMaxViewsChange={setMaxViews}
        onGenerate={draft.generate}
      />
    </>
  );
}