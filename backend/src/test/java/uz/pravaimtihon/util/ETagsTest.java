package uz.pravaimtihon.util;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/** B-07: If-None-Match solishtirishda zaif (W/) prefiks e'tiborga olinmaydi. */
class ETagsTest {

    @Test
    void strongEtagIsQuotedAndStable() {
        String a = ETags.strongOf("hello");
        assertThat(a).startsWith("\"").endsWith("\"").hasSize(34);
        assertThat(ETags.strongOf("hello")).isEqualTo(a);
        assertThat(ETags.strongOf("hello!")).isNotEqualTo(a);
    }

    @Test
    void matchesIgnoresWeakPrefixAndSupportsLists() {
        String etag = "\"v2-10.5-3.1\"";
        assertThat(ETags.matches(etag, etag)).isTrue();
        assertThat(ETags.matches("W/" + etag, etag)).isTrue();
        assertThat(ETags.matches("\"other\", W/" + etag, etag)).isTrue();
        assertThat(ETags.matches("*", etag)).isTrue();
        assertThat(ETags.matches("\"other\"", etag)).isFalse();
        assertThat(ETags.matches(null, etag)).isFalse();
        assertThat(ETags.matches("", etag)).isFalse();
    }
}
