"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import PasscodePanel from "./PasscodePanel";
import PastebinEditor from "./PastebinEditor";
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

  const draft = usePastebinSecret({
    text,
    setText,
    passcode,
    maxViews,
    requirePasscode,
    setIsFlying,
  });

  const handleCreateAnother = () => {
    draft.clearLink();
    setText("");
    setPasscode("");
    setMaxViews("");
    setRequirePasscode(false);
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
