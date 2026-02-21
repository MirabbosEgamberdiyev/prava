package uz.pravaimtihon.config;

import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;
import uz.pravaimtihon.enums.AcceptLanguage;

@Component
public class AcceptLanguageConverter implements Converter<String, AcceptLanguage> {
    @Override
    public AcceptLanguage convert(String source) {
        return AcceptLanguage.fromCode(source);
    }
}