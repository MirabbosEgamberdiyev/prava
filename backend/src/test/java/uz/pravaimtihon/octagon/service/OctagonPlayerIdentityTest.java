package uz.pravaimtihon.octagon.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import uz.pravaimtihon.entity.User;
import uz.pravaimtihon.octagon.enums.OctagonRank;

import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Octagon player identity: names, masked phones, avatars, bot personas, leagues")
class OctagonPlayerIdentityTest {

    private static User user(Long id, String first, String last, String phone) {
        User u = new User();
        u.setId(id);
        u.setFirstName(first);
        u.setLastName(last);
        u.setPhoneNumber(phone);
        return u;
    }

    @Test
    @DisplayName("Name: 'Ism F.' when the profile has a name")
    void nameFromProfile() {
        assertEquals("Ali V.", OctagonService.shortName(user(1L, "Ali", "Valiyev", "+998901234512")));
        assertEquals("Ali", OctagonService.shortName(user(1L, " Ali ", null, null)));
        assertEquals("Valiyev", OctagonService.shortName(user(1L, null, "Valiyev", null)));
    }

    @Test
    @DisplayName("Name: masked phone when there is no name — never null/undefined/blank")
    void maskedPhoneFallback() {
        assertEquals("+998 90 *** ** 12", OctagonService.shortName(user(7L, null, null, "+998901234512")));
        assertEquals("+998 90 *** ** 12", OctagonService.shortName(user(7L, "null", "undefined", "998901234512")));
        assertEquals("+998 93 *** ** 45", OctagonService.shortName(user(7L, "  ", "", "931234545")));
        assertEquals("Haydovchi #7", OctagonService.shortName(user(7L, null, null, null)));
    }

    @Test
    @DisplayName("Masked phone never leaks the middle digits")
    void maskPhoneHidesDigits() {
        String masked = OctagonService.maskPhone("+998901234567");
        assertNotNull(masked);
        assertFalse(masked.contains("12345"));
        assertTrue(masked.endsWith("67"));
        assertNull(OctagonService.maskPhone("12"));
        assertNull(OctagonService.maskPhone(null));
    }

    @Test
    @DisplayName("Avatar: only https or our own /api/v1/files paths are passed to clients")
    void avatarWhitelist() {
        assertEquals("https://lh3.googleusercontent.com/a/x", OctagonService.safeAvatarUrl(" https://lh3.googleusercontent.com/a/x "));
        assertEquals("/api/v1/files/profiles/1.jpg", OctagonService.safeAvatarUrl("/api/v1/files/profiles/1.jpg"));
        assertNull(OctagonService.safeAvatarUrl("javascript:alert(1)"));
        assertNull(OctagonService.safeAvatarUrl("http://insecure.example/a.png"));
        assertNull(OctagonService.safeAvatarUrl("https://x/\"><script>"));
        assertNull(OctagonService.safeAvatarUrl(""));
        assertNull(OctagonService.safeAvatarUrl(null));
    }

    @Test
    @DisplayName("Bot personas: realistic names, stable per bot id, id still recognised as a bot")
    void botPersonas() {
        Set<String> seen = new HashSet<>();
        for (int i = 0; i < 200; i++) {
            String id = OctagonBotPersonas.newBotId();
            assertTrue(OctagonService.isBotId(id), id);
            assertTrue(id.matches("bot_\\d{2}_[0-9a-f]{6}"), id);
            String name = OctagonBotPersonas.nameFor(id);
            assertEquals(name, OctagonBotPersonas.nameFor(id), "same bot → same name");
            assertFalse(name.contains("_") || name.toLowerCase().contains("bot"), name);
            seen.add(name);
        }
        assertTrue(seen.size() > 10, "names are varied");
        // legacy ids (bot_ab12cd) still get a human name, not "OctagonBot"
        assertTrue(OctagonBotPersonas.NAMES.contains(OctagonBotPersonas.nameFor("bot_ab12cd")));
    }

    @Test
    @DisplayName("Six leagues: Bronza → Kumush → Oltin → Platina → Olmos → Master")
    void sixLeagues() {
        assertEquals(6, OctagonRank.values().length);
        assertEquals(OctagonRank.BRONZE, OctagonRank.fromElo(0));
        assertEquals(OctagonRank.BRONZE, OctagonRank.fromElo(49));
        assertEquals(OctagonRank.SILVER, OctagonRank.fromElo(50));
        assertEquals(OctagonRank.GOLD, OctagonRank.fromElo(150));
        assertEquals(OctagonRank.PLATINUM, OctagonRank.fromElo(300));
        assertEquals(OctagonRank.PLATINUM, OctagonRank.fromElo(499));
        assertEquals(OctagonRank.BRILLIANT, OctagonRank.fromElo(500));
        assertEquals("Olmos", OctagonRank.BRILLIANT.getDisplayName());
        assertEquals(OctagonRank.MASTER, OctagonRank.fromElo(800));
        assertEquals(OctagonRank.MASTER, OctagonRank.fromElo(5000));
        assertEquals(OctagonRank.BRONZE, OctagonRank.fromElo(-5));
    }
}
