package uz.pravaimtihon.security;

import jakarta.servlet.http.HttpServletRequest;

import java.net.InetAddress;

/**
 * Mijozning haqiqiy IP manzilini aniqlaydi.
 *
 * <p>SECURITY: {@code X-Real-IP} / {@code X-Forwarded-For} header'lari faqat so'rov ishonchli
 * proxy'dan (nginx: loopback yoki Docker/ichki tarmoq) kelganda hisobga olinadi. Avval ular
 * shartsiz qabul qilinardi — backend porti ochiq bo'lganda hujumchi har so'rovda yangi
 * "IP" yuborib rate-limit'ni butunlay chetlab o'tardi.
 */
public final class ClientIpResolver {

    private ClientIpResolver() {
    }

    public static String resolve(HttpServletRequest request) {
        String remote = request.getRemoteAddr();
        if (!isTrustedProxy(remote)) {
            return remote;
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            String[] hops = xff.split(",");
            String lastHop = hops[hops.length - 1].trim();
            if (!lastHop.isEmpty()) {
                return lastHop;
            }
        }
        return remote;
    }

    static boolean isTrustedProxy(String addr) {
        if (addr == null || addr.isBlank()) return false;
        // Faqat IP literal'lar — DNS so'rovi qilinmasin.
        if (!addr.matches("[0-9a-fA-F:.]+")) return false;
        try {
            InetAddress ip = InetAddress.getByName(addr);
            return ip.isLoopbackAddress() || ip.isSiteLocalAddress();
        } catch (Exception e) {
            return false;
        }
    }
}
