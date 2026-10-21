import React, { useRef } from "react";
import { pinAfterBackspace, pinAfterInput, sanitizePin } from "../pin";

interface Props {
  value: string;
  onChange: (value: string) => void;
  /** 4-raqam kiritilishi bilan chaqiriladi (Enter shart emas). */
  onComplete?: (code: string) => void;
  length?: number;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
  label: string;
}

/**
 * 4 katakli PIN/OTP kiritish: har katakka bitta raqam, avtomatik keyingisiga o'tish, Backspace bilan
 * oldingisiga qaytish, to'liq kodni joylashtirish (paste) va telefonda raqamli klaviatura.
 */
export const OctagonPinInput: React.FC<Props> = ({
  value,
  onChange,
  onComplete,
  length = 4,
  disabled,
  error,
  autoFocus,
  label,
}) => {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  const focusCell = (i: number) => refs.current[Math.max(0, Math.min(length - 1, i))]?.focus();

  const update = (next: { value: string; focus: number }) => {
    onChange(next.value);
    focusCell(next.focus);
    if (next.value.length === length && next.value !== value) onComplete?.(next.value);
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      update(pinAfterBackspace(value, i));
    } else if (e.key === "ArrowLeft") {
      focusCell(i - 1);
    } else if (e.key === "ArrowRight") {
      focusCell(i + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = sanitizePin(e.clipboardData.getData("text"), length);
    if (!pasted) return;
    e.preventDefault();
    update({ value: pasted, focus: Math.min(pasted.length, length - 1) });
  };

  return (
    <div className={`oct-pin ${error ? "error" : ""}`} role="group" aria-label={label}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className="oct-pin-cell"
          value={d}
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={length}
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          aria-label={`${label} ${i + 1}/${length}`}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => {
            let typed = e.currentTarget.value;
            // To'la katakda belgilanmagan holda yozilsa ("4" + "7") — faqat yangi raqam olinadi
            if (d && typed.length === 2) typed = typed.startsWith(d) ? typed.slice(1) : typed.slice(0, 1);
            update(pinAfterInput(value, i, typed, length));
          }}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
        />
      ))}
    </div>
  );
};
