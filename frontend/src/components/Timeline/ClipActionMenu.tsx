import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useShallow } from "zustand/react/shallow";
import { useTimelineStore } from "../../stores/timelineStore";
import { StudioIcon, type StudioIconName } from "../StudioIcon";

interface ClipActionMenuProps {
  clipId: string;
  anchor: { x: number; y: number };
  splitTime: number;
  onClose: () => void;
}

interface MenuActionProps {
  icon: StudioIconName;
  label: string;
  shortcut?: string;
  disabled?: boolean;
  destructive?: boolean;
  onSelect: () => void;
}

function MenuAction({
  icon,
  label,
  shortcut,
  disabled = false,
  destructive = false,
  onSelect,
}: MenuActionProps) {
  return (
    <button
      className={`clip-action-menu__item ${
        destructive ? "clip-action-menu__item--danger" : ""
      }`}
      disabled={disabled}
      onClick={onSelect}
      role="menuitem"
      tabIndex={-1}
      type="button"
    >
      <StudioIcon name={icon} size={14} />
      <span>{label}</span>
      {shortcut ? (
        <kbd className="clip-action-menu__shortcut">{shortcut}</kbd>
      ) : null}
    </button>
  );
}

export function ClipActionMenu({
  clipId,
  anchor,
  splitTime,
  onClose,
}: ClipActionMenuProps) {
  const {
    tracks,
    playheadPosition,
    duplicateClip,
    removeClip,
    splitClip,
    trimClip,
    updateClip,
  } = useTimelineStore(
    useShallow((state) => ({
      tracks: state.tracks,
      playheadPosition: state.playheadPosition,
      duplicateClip: state.duplicateClip,
      removeClip: state.removeClip,
      splitClip: state.splitClip,
      trimClip: state.trimClip,
      updateClip: state.updateClip,
    }))
  );
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(anchor);

  const clip = useMemo(
    () =>
      tracks
        .flatMap((track) => track.clips)
        .find((candidate) => candidate.id === clipId),
    [clipId, tracks]
  );

  const clipEnd = clip ? clip.startTime + clip.duration : 0;
  const isPlayheadInside = Boolean(
    clip &&
      playheadPosition > clip.startTime + 0.05 &&
      playheadPosition < clipEnd - 0.05
  );
  const canSplitHere = Boolean(
    clip &&
      splitTime > clip.startTime + 0.05 &&
      splitTime < clipEnd - 0.05
  );
  const canMute = clip?.type === "video" || clip?.type === "audio";

  const runAction = useCallback(
    (action: () => void) => {
      action();
      onClose();
    },
    [onClose]
  );

  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;

    const edge = 12;
    const rect = menu.getBoundingClientRect();
    setPosition({
      x: Math.min(
        window.innerWidth - rect.width - edge,
        Math.max(edge, anchor.x)
      ),
      y: Math.min(
        window.innerHeight - rect.height - edge,
        Math.max(edge, anchor.y)
      ),
    });
  }, [anchor]);

  useEffect(() => {
    const menu = menuRef.current;
    const firstEnabledItem =
      menu?.querySelector<HTMLButtonElement>("button:not(:disabled)");
    firstEnabledItem?.focus();

    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !menuRef.current?.contains(event.target)
      ) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const items = Array.from(
        menuRef.current?.querySelectorAll<HTMLButtonElement>(
          "button:not(:disabled)"
        ) ?? []
      );
      const currentIndex = items.indexOf(
        document.activeElement as HTMLButtonElement
      );

      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      } else if (event.key === "ArrowDown" && items.length > 0) {
        event.preventDefault();
        items[(currentIndex + 1 + items.length) % items.length]?.focus();
      } else if (event.key === "ArrowUp" && items.length > 0) {
        event.preventDefault();
        items[(currentIndex - 1 + items.length) % items.length]?.focus();
      } else if (event.key === "Home" && items.length > 0) {
        event.preventDefault();
        items[0]?.focus();
      } else if (event.key === "End" && items.length > 0) {
        event.preventDefault();
        items.at(-1)?.focus();
      }
    };

    const closeMenu = () => onClose();
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", closeMenu);
    window.addEventListener("scroll", closeMenu, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
    };
  }, [onClose]);

  if (!clip) return null;

  return createPortal(
    <div
      ref={menuRef}
      aria-label={`Edit ${clip.name}`}
      className="clip-action-menu"
      role="menu"
      style={{ left: position.x, top: position.y }}
    >
      <div className="clip-action-menu__heading">
        <span className="clip-action-menu__name">{clip.name}</span>
        <span className="clip-action-menu__duration">
          {clip.duration.toFixed(1)}s
        </span>
      </div>
      <div className="clip-action-menu__group">
        <MenuAction
          disabled={!canSplitHere}
          icon="blade"
          label="Split Here"
          onSelect={() => runAction(() => splitClip(clip.id, splitTime))}
        />
        <MenuAction
          disabled={!isPlayheadInside}
          icon="split"
          label="Split at Playhead"
          onSelect={() =>
            runAction(() => splitClip(clip.id, playheadPosition))
          }
          shortcut="⌘B"
        />
      </div>
      <div className="clip-action-menu__group">
        <MenuAction
          disabled={!isPlayheadInside}
          icon="skipBack"
          label="Trim Start to Playhead"
          onSelect={() =>
            runAction(() => trimClip(clip.id, "start", playheadPosition))
          }
        />
        <MenuAction
          disabled={!isPlayheadInside}
          icon="skipForward"
          label="Trim End to Playhead"
          onSelect={() =>
            runAction(() => trimClip(clip.id, "end", playheadPosition))
          }
        />
      </div>
      <div className="clip-action-menu__group">
        <MenuAction
          icon="plus"
          label="Duplicate"
          onSelect={() => runAction(() => duplicateClip(clip.id))}
          shortcut="⌘D"
        />
        <MenuAction
          disabled={!canMute}
          icon={clip.muted ? "volume" : "mute"}
          label={clip.muted ? "Unmute Clip" : "Mute Clip"}
          onSelect={() =>
            runAction(() => updateClip(clip.id, { muted: !clip.muted }))
          }
          shortcut="M"
        />
      </div>
      <div className="clip-action-menu__group">
        <MenuAction
          destructive
          icon="trash"
          label="Delete Clip"
          onSelect={() => runAction(() => removeClip(clip.id))}
          shortcut="⌫"
        />
      </div>
    </div>,
    document.body
  );
}
