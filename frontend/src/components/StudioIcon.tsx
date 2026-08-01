import type { CSSProperties, SVGProps } from "react";

export type StudioIconName =
  | "attach"
  | "audio"
  | "blade"
  | "caption"
  | "direct"
  | "export"
  | "fullscreen"
  | "guides"
  | "key"
  | "lock"
  | "magnet"
  | "media"
  | "more"
  | "mute"
  | "pause"
  | "play"
  | "plus"
  | "pointer"
  | "redo"
  | "search"
  | "send"
  | "skipBack"
  | "skipForward"
  | "split"
  | "trash"
  | "type"
  | "undo"
  | "upload"
  | "video"
  | "volume"
  | "wave"
  | "x";

interface StudioIconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: StudioIconName;
  size?: number;
}

const baseStyle: CSSProperties = {
  display: "block",
  flex: "0 0 auto",
};

export function StudioIcon({
  name,
  size = 16,
  className = "",
  ...props
}: StudioIconProps) {
  const content = (() => {
    switch (name) {
      case "attach":
        return (
          <path d="m8 12 6-6a4 4 0 0 1 6 6l-8 8a6 6 0 0 1-8-8l8-8" />
        );
      case "audio":
        return (
          <>
            <path d="M9 18V5l10-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="16" cy="16" r="3" />
          </>
        );
      case "blade":
        return (
          <>
            <circle cx="7" cy="17" r="3" />
            <circle cx="17" cy="17" r="3" />
            <path d="m9 15 8-10M15 15 7 5" />
          </>
        );
      case "caption":
        return (
          <>
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M7 11h4M7 15h6M15 11h2M15 15h2" />
          </>
        );
      case "direct":
        return (
          <>
            <path d="M5 5h5v5H5zM14 14h5v5h-5z" />
            <path d="M10 7.5h4a3 3 0 0 1 3 3V14M14 16.5h-4a3 3 0 0 1-3-3V10" />
          </>
        );
      case "export":
        return (
          <>
            <path d="M12 15V3M8 7l4-4 4 4" />
            <path d="M5 12v8h14v-8" />
          </>
        );
      case "fullscreen":
        return <path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" />;
      case "guides":
        return (
          <>
            <rect x="4" y="5" width="16" height="14" rx="1" />
            <path d="M8 5v14M16 5v14M4 9h16M4 15h16" />
          </>
        );
      case "key":
        return (
          <>
            <circle cx="8" cy="10" r="4" />
            <path d="m11 13 8 8M15 17l2-2M17 19l2-2" />
          </>
        );
      case "lock":
        return (
          <>
            <rect x="5" y="10" width="14" height="10" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </>
        );
      case "magnet":
        return (
          <>
            <path d="M5 4v9a7 7 0 0 0 14 0V4h-5v9a2 2 0 0 1-4 0V4Z" />
            <path d="M5 8h5M14 8h5" />
          </>
        );
      case "media":
        return (
          <>
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="m8 15 3-3 2 2 3-4 3 5M8 8h.01" />
          </>
        );
      case "more":
        return (
          <>
            <circle cx="5" cy="12" r="1" />
            <circle cx="12" cy="12" r="1" />
            <circle cx="19" cy="12" r="1" />
          </>
        );
      case "mute":
        return (
          <>
            <path d="M5 10h4l4-4v12l-4-4H5ZM17 9l4 6M21 9l-4 6" />
          </>
        );
      case "pause":
        return <path d="M8 5v14M16 5v14" />;
      case "play":
        return <path d="m8 5 11 7-11 7Z" />;
      case "plus":
        return <path d="M12 5v14M5 12h14" />;
      case "pointer":
        return <path d="m5 3 13 9-6 1-3 6Z" />;
      case "redo":
        return (
          <>
            <path d="m15 7 5 5-5 5" />
            <path d="M20 12h-9a6 6 0 0 0-6 6" />
          </>
        );
      case "search":
        return (
          <>
            <circle cx="11" cy="11" r="6" />
            <path d="m16 16 4 4" />
          </>
        );
      case "send":
        return (
          <>
            <path d="m4 4 17 8-17 8 3-8Z" />
            <path d="M7 12h14" />
          </>
        );
      case "skipBack":
        return (
          <>
            <path d="M6 5v14" />
            <path d="M18 6 9 12l9 6Z" />
          </>
        );
      case "skipForward":
        return (
          <>
            <path d="M18 5v14" />
            <path d="m6 6 9 6-9 6Z" />
          </>
        );
      case "split":
        return <path d="M12 3v18M7 7H4v10h3M17 7h3v10h-3" />;
      case "trash":
        return (
          <>
            <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13" />
            <path d="M10 11v5M14 11v5" />
          </>
        );
      case "type":
        return <path d="M5 5h14M12 5v14M8 19h8" />;
      case "undo":
        return (
          <>
            <path d="m9 7-5 5 5 5" />
            <path d="M4 12h9a6 6 0 0 1 6 6" />
          </>
        );
      case "upload":
        return (
          <>
            <path d="M12 16V4M8 8l4-4 4 4" />
            <path d="M5 14v5h14v-5" />
          </>
        );
      case "video":
        return (
          <>
            <rect x="3" y="6" width="13" height="12" rx="2" />
            <path d="m16 10 5-3v10l-5-3" />
          </>
        );
      case "volume":
        return (
          <>
            <path d="M5 10h4l4-4v12l-4-4H5Z" />
            <path d="M16 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12" />
          </>
        );
      case "wave":
        return <path d="M3 12h2l2-6 3 12 3-9 3 6 2-3h3" />;
      case "x":
        return <path d="m6 6 12 12M18 6 6 18" />;
    }
  })();

  return (
    <svg
      aria-hidden="true"
      className={`studio-icon ${className}`}
      fill="none"
      height={size}
      style={baseStyle}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.65"
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      {content}
    </svg>
  );
}
