import { useState } from "react";
import { Check, Copy, Pencil, Plus, Barcode } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { formatIsrc, parseIsrc } from "@/lib/isrc";

/** Read-only ISRC badge; click to copy. Renders nothing when there's no ISRC. */
export const IsrcBadge = ({ isrc }: { isrc: string | null | undefined }) => {
  const [copied, setCopied] = useState(false);
  if (!isrc) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(isrc);
      setCopied(true);
      toast.success("ISRC copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy to clipboard");
    }
  };

  return (
    <Badge
      variant="outline"
      onClick={copy}
      title="Click to copy ISRC"
      className="gap-1 font-mono text-xs cursor-pointer hover:bg-foreground/5"
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      ISRC {formatIsrc(isrc)}
    </Badge>
  );
};

interface IsrcEditorProps {
  trackId: string;
  isrc: string | null | undefined;
  onSaved?: (isrc: string | null) => void;
}

/** Badge + popover editor for an artist to add, change or remove a track's ISRC. */
export const IsrcEditor = ({ trackId, isrc, onSaved }: IsrcEditorProps) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(isrc ? formatIsrc(isrc) : "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async (raw: string) => {
    const result = parseIsrc(raw);
    if (!result.valid) {
      setError(result.error);
      return;
    }
    setSaving(true);
    const { error: updateError } = await supabase
      .from("tracks")
      .update({ isrc: result.value })
      .eq("id", trackId);
    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    toast.success(result.value ? "ISRC saved" : "ISRC removed");
    onSaved?.(result.value);
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-1">
      <IsrcBadge isrc={isrc} />
      <Popover
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (o) {
            setValue(isrc ? formatIsrc(isrc) : "");
            setError(null);
          }
        }}
      >
        <PopoverTrigger asChild>
          {isrc ? (
            <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="Edit ISRC">
              <Pencil className="w-3 h-3" />
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="h-6 gap-1 text-xs px-2">
              <Plus className="w-3 h-3" />
              Add ISRC
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save(value);
            }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2">
              <Barcode className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor={`isrc-${trackId}`} className="font-semibold">
                ISRC
              </Label>
            </div>
            <Input
              id={`isrc-${trackId}`}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(null);
              }}
              placeholder="e.g. ZA-ABC-24-00001"
              maxLength={20}
              autoComplete="off"
              autoFocus
              className="font-mono uppercase"
            />
            {error ? (
              <p className="text-xs text-destructive">{error}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Format: country (2) · registrant (3) · year (2) · number (5)
              </p>
            )}
            <div className="flex justify-between gap-2">
              {isrc ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={saving}
                  onClick={() => save("")}
                  className="text-destructive"
                >
                  Remove
                </Button>
              ) : (
                <span />
              )}
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </PopoverContent>
      </Popover>
    </div>
  );
};
