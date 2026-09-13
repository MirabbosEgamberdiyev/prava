package uz.pravaimtihon.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.pravaimtihon.entity.PartnerLead;
import uz.pravaimtihon.enums.PartnerLeadStatus;
import uz.pravaimtihon.exception.ResourceNotFoundException;
import uz.pravaimtihon.repository.PartnerLeadRepository;

@Service
@Slf4j
@RequiredArgsConstructor
public class PartnerLeadService {

    private final PartnerLeadRepository leadRepository;

    @Transactional
    public PartnerLead createLead(PartnerLead lead) {
        if (lead.getStatus() == null) {
            lead.setStatus(PartnerLeadStatus.NEW);
        }
        return leadRepository.save(lead);
    }

    @Transactional(readOnly = true)
    public Page<PartnerLead> getAllLeads(Pageable pageable, PartnerLeadStatus status, String search) {
        return leadRepository.searchLeads(status, search, pageable);
    }

    @Transactional(readOnly = true)
    public PartnerLead getLeadById(Long id) {
        return leadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hamkorlik so'rovi topilmadi"));
    }

    @Transactional
    public PartnerLead updateStatus(Long id, PartnerLeadStatus status, String adminNote) {
        PartnerLead lead = getLeadById(id);
        if (status != null) {
            lead.setStatus(status);
        }
        if (adminNote != null) {
            lead.setAdminNote(adminNote);
        }
        return leadRepository.save(lead);
    }

    @Transactional
    public void deleteLead(Long id) {
        PartnerLead lead = getLeadById(id);
        leadRepository.delete(lead);
    }
}
