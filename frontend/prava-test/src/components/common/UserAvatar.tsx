import { Avatar, type AvatarProps } from "@mantine/core";
import { getAvatarUrl } from "../../utils/imageUtils";

interface Props extends Omit<AvatarProps, "src" | "children"> {
  imageUrl?: string | null;
  initials: string;
  alt?: string;
}

/**
 * Foydalanuvchi avatari: profil rasmi (yuklangan / tayyor / Google-Telegram) yoki bosh harflar.
 * Rasm yuklanmasa Mantine Avatar o'zi bosh harflarga qaytadi — buzilgan rasm belgisi ko'rinmaydi.
 */
export function UserAvatar({ imageUrl, initials, alt, ...rest }: Props) {
  return (
    <Avatar {...rest} src={getAvatarUrl(imageUrl) ?? null} alt={alt} imageProps={{ referrerPolicy: "no-referrer" }}>
      {initials}
    </Avatar>
  );
}
