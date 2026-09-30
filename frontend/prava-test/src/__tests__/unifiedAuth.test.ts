import { describe, expect, it } from "vitest";
import uzl from "../locales/uzl.json";
import uzc from "../locales/uzc.json";
import ru from "../locales/ru.json";

describe("UnifiedAuth Localization & Configuration", () => {
  it("has exact title and subtitle matching user specification across all locales", () => {
    // Left view (Main Auth)
    expect(uzl.authV2.login.title).toBe("Xush kelibsiz!");
    expect(uzc.authV2.login.title).toBe("Хуш келибсиз!");
    expect(ru.authV2.login.title).toBe("Добро пожаловать!");

    expect(uzl.authV2.register.subtitle).toBe(
      "Bepul hisob yarating va imtihonga tayyorlanishni boshlang."
    );
    expect(uzc.authV2.register.subtitle).toBe(
      "Бепул ҳисоб яратинг ва имтиҳонга тайёрланишни бошланг."
    );
    expect(ru.authV2.register.subtitle).toBe(
      "Создайте бесплатный аккаунт и начните подготовку к экзамену."
    );

    // Right view (Qurilmani bog'lash)
    expect(uzl.qr.devicePairingTitle).toBe("Qurilmani bog'lash");
    expect(uzc.qr.devicePairingTitle).toBe("Қурилмани боғлаш");
    expect(ru.qr.devicePairingTitle).toBe("Привязка устройства");

    expect(uzl.qr.devicePairingDesc).toBe(
      "Hisobingizni mobil ilova bilan bog'lash uchun telefoningizdagi ilova bilan QR kodni skaner qiling."
    );
    expect(uzc.qr.devicePairingDesc).toBe(
      "Ҳисобингизни мобил илова билан боғлаш учун телефонингиздаги илова билан QR кодни сканер қилинг."
    );
    expect(ru.qr.devicePairingDesc).toBe(
      "Чтобы привязать аккаунт к мобильному приложению, отсканируйте QR-код приложением на телефоне."
    );

    // Buttons
    expect(uzl.qr.appLoginTitle).toBe("Mobil ilova orqali kiring");
    expect(uzc.qr.appLoginTitle).toBe("Мобил илова орқали киринг");
    expect(ru.qr.appLoginTitle).toBe("Войти через приложение");

    expect(uzl.qr.copyLink).toBe("Yoki havolani nusxalash");
    expect(uzc.qr.copyLink).toBe("Ёки ҳаволани нусхалаш");
    expect(ru.qr.copyLink).toBe("Или скопировать ссылку");
  });

  it("has consistent guest continuation and divider keys", () => {
    expect(uzl.auth.continueGuest).toBe("Mehmon sifatida davom etish");
    expect(uzl.auth.orContinueWith).toBe("yoki");
  });
});
