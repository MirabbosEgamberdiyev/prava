package uz.pravaimtihon.octagon.service;

import java.security.SecureRandom;
import java.util.HexFormat;
import java.util.List;

/**
 * Zaxira bot raqiblarining "inson" profillari.
 *
 * 20 soniyada tirik raqib topilmasa bot ulanadi; u oddiy foydalanuvchidek ko'rinishi kerak
 * (avval "Dilshod_77", "Sardor_Pro" kabi taxalluslar va tarixda "OctagonBot ⚡" chiqardi).
 * Ism bot ID'sidan deterministik olinadi ({@code bot_<indeks>_<tasodifiy>}) — jang ekrani,
 * natija va tarix bir xil ismni ko'rsatadi. Bot rasmi yo'q: klientlar ism bosh harfi bilan
 * avatar chizadi (rasmsiz haqiqiy foydalanuvchilar kabi).
 */
public final class OctagonBotPersonas {

    private static final SecureRandom RANDOM = new SecureRandom();

    static final List<String> NAMES = List.of(
            "Dilshod K.", "Sardor A.", "Shahzod R.", "Kamola Y.", "Bekzod T.", "Malika S.",
            "Jasur M.", "Nodira X.", "Otabek N.", "Gulnoza E.", "Sherzod B.", "Madina Q.",
            "Javohir U.", "Dilnoza F.", "Aziz H.", "Sevara O.", "Bobur I.", "Zarina D.",
            "Ulug'bek S.", "Feruza G.", "Sanjar P.", "Mohira J.", "Rustam V.", "Nilufar Z.",
            "Алексей П.", "Дмитрий С.", "Наталья К.", "Артём Л.", "Екатерина М.", "Руслан Т."
    );

    private OctagonBotPersonas() {
    }

    /** Yangi bot ID'si: {@code bot_<2 xonali indeks>_<6 hex>}. */
    public static String newBotId() {
        int idx = RANDOM.nextInt(NAMES.size());
        byte[] raw = new byte[3];
        RANDOM.nextBytes(raw);
        return String.format("bot_%02d_%s", idx, HexFormat.of().formatHex(raw));
    }

    /** Bot ID'sidan ism; eski formatdagi ID'lar uchun ham barqaror ism qaytaradi. */
    public static String nameFor(String botId) {
        if (botId == null) return NAMES.get(0);
        String[] parts = botId.split("_");
        if (parts.length >= 3) {
            try {
                int idx = Integer.parseInt(parts[1]);
                if (idx >= 0 && idx < NAMES.size()) return NAMES.get(idx);
            } catch (NumberFormatException ignored) {
                // eski format
            }
        }
        return NAMES.get(Math.floorMod(botId.hashCode(), NAMES.size()));
    }
}
