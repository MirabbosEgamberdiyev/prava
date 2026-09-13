package uz.pravaimtihon.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.pravaimtihon.entity.SystemSetting;
import uz.pravaimtihon.repository.SystemSettingRepository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class SettingsService {

    private final SystemSettingRepository settingRepository;

    @Transactional(readOnly = true)
    public Map<String, String> getAllSettings() {
        List<SystemSetting> list = settingRepository.findAll();
        Map<String, String> map = new HashMap<>();

        // Default system settings
        map.put("siteName", "Prava Online");
        map.put("supportEmail", "info@pravaonline.uz");
        map.put("supportPhone", "+998 99 391 25 05");
        map.put("telegram", "https://t.me/pravaonlineuz");
        map.put("logo", "/favicon.svg");
        map.put("favicon", "/favicon.ico");
        map.put("seoTitle", "Prava Online — Avtotest va YHQ imtihoniga tayyorgarlik platformasi");
        map.put("seoDescription", "O'zbekiston bo'yicha 1400+ haqiqiy savollar, rasmiy biletlar va avtomaktablar uchun desktop litsenziyalar");
        map.put("seoKeywords", "prava, avtotest, yhq, haydovchilik guvohnomasi, imtihon, biletlar");

        for (SystemSetting s : list) {
            if (s.getSettingValue() != null) {
                map.put(s.getSettingKey(), s.getSettingValue());
            }
        }
        return map;
    }

    @Transactional
    public void updateSettings(Map<String, String> settings) {
        if (settings == null) return;
        for (Map.Entry<String, String> entry : settings.entrySet()) {
            String key = entry.getKey();
            String val = entry.getValue();

            SystemSetting setting = settingRepository.findBySettingKey(key)
                    .orElse(SystemSetting.builder().settingKey(key).build());
            setting.setSettingValue(val);
            settingRepository.save(setting);
        }
        log.info("System settings updated: {}", settings.keySet());
    }
}
