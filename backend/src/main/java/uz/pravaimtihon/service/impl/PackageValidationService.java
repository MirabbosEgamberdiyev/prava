package uz.pravaimtihon.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.pravaimtihon.dto.request.PackageRequest;
import uz.pravaimtihon.entity.Topic;
import uz.pravaimtihon.enums.AcceptLanguage;
import uz.pravaimtihon.enums.PackageGenerationType;
import uz.pravaimtihon.exception.BusinessException;
import uz.pravaimtihon.repository.ExamPackageRepository;
import uz.pravaimtihon.service.MessageService;

import java.math.BigDecimal;

/**
 * Service responsible for package validation logic.
 *
 * Features:
 * - Package name uniqueness validation across all 4 languages
 * - Price validation for paid packages
 * - Topic resolution for AUTO_TOPIC generation
 *
 * @author Prava Online Development Team
 * @version 1.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PackageValidationService {

    private final ExamPackageRepository packageRepository;
    private final TopicService topicService;
    private final MessageService messageService;

    /**
     * Validate package name uniqueness across ALL 4 languages.
     *
     * Checks if any of the provided names (UZL, UZC, EN, RU) already exist
     * in the database. For updates, excludes the current package from the check.
     *
     * @param request   Package request with name fields
     * @param excludeId Package ID to exclude (null for new packages)
     * @param language  User's preferred language for error messages
     * @throws BusinessException If a duplicate name is found
     */
    public void validateUniquePackageNameAllLanguages(
            PackageRequest request,
            Long excludeId,
            AcceptLanguage language
    ) {
        log.debug("Validating package name uniqueness across all languages");

        boolean exists = (excludeId == null)
                ? packageRepository.existsByAnyName(
                request.getNameUzl(),
                request.getNameUzc(),
                request.getNameEn(),
                request.getNameRu()
        )
                : packageRepository.existsByAnyNameExcludingId(
                request.getNameUzl(),
                request.getNameUzc(),
                request.getNameEn(),
                request.getNameRu(),
                excludeId
        );

        if (exists) {
            log.warn("Package name already exists: UZL={}, UZC={}, EN={}, RU={}",
                    request.getNameUzl(), request.getNameUzc(),
                    request.getNameEn(), request.getNameRu());
            throw new BusinessException(
                    messageService.getMessage("error.package.name.exists.any.language", language)
            );
        }
    }

    /**
     * Validate package price for paid packages.
     *
     * Rules:
     * - Free packages: no price validation
     * - Paid packages: price must be greater than zero
     *
     * @param request  Package request with isFree and price fields
     * @param language User's preferred language for error messages
     * @throws BusinessException If price validation fails
     */
    public void validatePackagePrice(PackageRequest request, AcceptLanguage language) {
        if (!request.getIsFree() &&
                (request.getPrice() == null || request.getPrice().compareTo(BigDecimal.ZERO) <= 0)) {
            log.warn("Invalid price for paid package: isFree={}, price={}",
                    request.getIsFree(), request.getPrice());
            throw new BusinessException(
                    messageService.getMessage("error.package.price.required", language)
            );
        }
    }

    /**
     * Validate price value is positive (for PATCH operations).
     *
     * @param price    The price to validate
     * @param language User's preferred language for error messages
     * @throws BusinessException If price is not positive
     */
    public void validatePriceValue(BigDecimal price, AcceptLanguage language) {
        if (price != null && price.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException(
                    messageService.getMessage("error.package.price.invalid", language)
            );
        }
    }

    /**
     * Resolve topic for package based on generation type.
     *
     * Rules:
     * - AUTO_TOPIC: topic ID is required, returns resolved Topic
     * - AUTO_RANDOM/MANUAL: returns null (no topic needed)
     *
     * @param request  Package request with generation type and topic ID
     * @param language User's preferred language for error messages
     * @return Topic entity or null
     * @throws BusinessException If topic is required but not provided
     */
    public Topic resolveTopicForPackage(PackageRequest request, AcceptLanguage language) {
        if (request.getGenerationType() == PackageGenerationType.AUTO_TOPIC) {
            if (request.getTopicId() == null) {
                log.warn("Topic ID required for AUTO_TOPIC generation type");
                throw new BusinessException(
                        messageService.getMessage("error.package.topic.required", language)
                );
            }
            return topicService.getTopicEntityById(request.getTopicId());
        }
        return null;
    }

    /**
     * Validate that manual package changes are allowed.
     *
     * @param generationType The package's generation type
     * @param language       User's preferred language for error messages
     * @throws BusinessException If operation not allowed for manual packages
     */
    public void validateNotManualForQuestionCountChange(
            PackageGenerationType generationType,
            AcceptLanguage language
    ) {
        if (generationType == PackageGenerationType.MANUAL) {
            throw new BusinessException(
                    messageService.getMessage("error.package.manual.question.count", language)
            );
        }
    }

    /**
     * Validate that question IDs can only be set for MANUAL packages.
     *
     * @param generationType The package's generation type
     * @param language       User's preferred language for error messages
     * @throws BusinessException If question IDs provided for non-manual package
     */
    public void validateManualOnlyForQuestionIds(
            PackageGenerationType generationType,
            AcceptLanguage language
    ) {
        if (generationType != PackageGenerationType.MANUAL) {
            throw new BusinessException(
                    messageService.getMessage("error.package.question.ids.only.manual", language)
            );
        }
    }

    /**
     * Validate that package can be regenerated.
     *
     * Rules:
     * - MANUAL packages cannot be regenerated
     *
     * @param generationType The package's generation type
     * @param language       User's preferred language for error messages
     * @throws BusinessException If package cannot be regenerated
     */
    public void validateCanRegenerate(
            PackageGenerationType generationType,
            AcceptLanguage language
    ) {
        if (generationType == PackageGenerationType.MANUAL) {
            throw new BusinessException(
                    messageService.getMessage("error.package.manual.regenerate", language)
            );
        }
    }

    /**
     * Validate that package has no active exam sessions.
     *
     * @param hasActiveExams Whether the package has active exams
     * @param language       User's preferred language for error messages
     * @throws BusinessException If package has active exams
     */
    public void validateNoActiveExams(boolean hasActiveExams, AcceptLanguage language) {
        if (hasActiveExams) {
            throw new BusinessException(
                    messageService.getMessage("error.package.has.active.exams", language)
            );
        }
    }
}
