interface Props {
  text?: string;
  size?: number;
}

export default function SteeringWheelPlaceholder({ text = "pravaonline.uz" }: Props) {
  return (
    <div className="exam-img-placeholder" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", overflow: "hidden" }}>
      <img
        src="/question-default.svg"
        alt={text}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
        draggable={false}
      />
    </div>
  );
}
