import { memo, useEffect, useState } from "react";
import { IconZoomIn } from "@tabler/icons-react";
import { offlineMediaManager } from "../../../services/offlineMediaManager";
import { networkModeManager } from "../../../sync/networkModeManager";
import { getImageUrl } from "../../../utils/imageUtils";

interface QuestionImageProps {
  path: string;
  alt: string;
  onZoom: (src: string) => void;
  zoomHint: string;
  brokenLabel?: string;
}

/** Render with key={path}: a new question remounts this component (fresh state, no stale flash). */
type Resolved = { path: string; src: string | null; done: boolean };

const DEFAULT_QUESTION_IMAGE = "/question-default.svg";

/**
 * Local-first question image: uses the offline media cache (synchronously when the object URL
 * is already warm), falls back to the remote URL only when online use is allowed and the image
 * is not cached (it is then cached in the background). Auto-fits the pane (object-fit: contain).
 * Questions without an image or with broken images 100% render /question-default.svg.
 */
export const QuestionImage = memo(function QuestionImage({ path, alt, onZoom, zoomHint }: QuestionImageProps) {
  const effectivePath = path || DEFAULT_QUESTION_IMAGE;
  const isDirect = effectivePath.startsWith("/") || effectivePath.startsWith("http://") || effectivePath.startsWith("https://") || effectivePath.startsWith("data:");

  const [res, setRes] = useState<Resolved>(() => {
    if (isDirect) {
      return { path: effectivePath, src: effectivePath, done: true };
    }
    const warm = offlineMediaManager.peekLocalImageUrl(effectivePath);
    return { path: effectivePath, src: warm, done: !!warm };
  });
  const [broken, setBroken] = useState(false);

  const current = res;

  useEffect(() => {
    if (current.done) return;
    if (isDirect) {
      setRes({ path: effectivePath, src: effectivePath, done: true });
      return;
    }
    let alive = true;
    offlineMediaManager
      .getLocalImageUrl(effectivePath)
      .then((local) => {
        if (!alive) return;
        if (local) {
          setRes({ path: effectivePath, src: local, done: true });
          return;
        }
        const remote = networkModeManager.isOnlineAllowed() ? getImageUrl(effectivePath) || DEFAULT_QUESTION_IMAGE : DEFAULT_QUESTION_IMAGE;
        setRes({ path: effectivePath, src: remote, done: true });
        if (remote && remote !== DEFAULT_QUESTION_IMAGE) offlineMediaManager.cacheImage(effectivePath).catch(() => {});
      })
      .catch(() => {
        if (alive) setRes({ path: effectivePath, src: DEFAULT_QUESTION_IMAGE, done: true });
      });
    return () => {
      alive = false;
    };
  }, [effectivePath, current.done, isDirect]);

  if (!current.done) return <div className="xd-media xd-media--loading" aria-busy="true" />;

  const src = (!current.src || broken) ? DEFAULT_QUESTION_IMAGE : current.src;

  return (
    <div className="xd-media">
      <button
        type="button"
        className="xd-media__btn"
        onClick={() => onZoom(src)}
        onDoubleClick={() => onZoom(src)}
        onMouseDown={(e) => e.preventDefault()}
        title={zoomHint}
      >
        <img
          src={src}
          alt={alt}
          className="xd-media__img"
          draggable={false}
          decoding="async"
          onError={() => {
            if (src !== DEFAULT_QUESTION_IMAGE) {
              setBroken(true);
            }
          }}
          onContextMenu={(e) => e.preventDefault()}
        />
        <span className="xd-media__hint" aria-hidden="true">
          <IconZoomIn size={14} /> <kbd className="xd-kbd">Z</kbd>
        </span>
      </button>
    </div>
  );
});

export default QuestionImage;
