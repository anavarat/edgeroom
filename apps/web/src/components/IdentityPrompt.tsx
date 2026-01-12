// edgeroom/apps/web/src/components/IdentityPrompt.tsx
import { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import { useIdentity } from "../hooks/useIdentity";

type IdentityPromptProps = {
  open: boolean;
};

export default function IdentityPrompt({ open }: IdentityPromptProps) {
  const { identity, setIdentity } = useIdentity();
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (identity) setDisplayName(identity.displayName);
  }, [identity]);

  const handleContinue = () => {
    if (!displayName.trim()) return;
    const nextIdentity = {
      userId: identity?.userId ?? crypto.randomUUID(),
      displayName: displayName.trim(),
    };
    setIdentity(nextIdentity);
  };

  return (
    <Dialog open={open} maxWidth="xs" fullWidth disableEscapeKeyDown>
      <DialogTitle>Choose your display name</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Display name"
          fullWidth
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          onClick={handleContinue}
          disabled={!displayName.trim()}
        >
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
}
