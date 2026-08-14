package com.synthora.rfq;

import com.synthora.rfq.dto.CreateRfqRequest;
import com.synthora.rfq.dto.RfqResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class RfqService {

    private final RfqRepository rfqRepository;

    public RfqService(RfqRepository rfqRepository) {
        this.rfqRepository = rfqRepository;
    }

    public RfqResponse createRfq(CreateRfqRequest request) {

        Rfq rfq = new Rfq();
        rfq.setBuyerId(request.buyerId());
        rfq.setProductId(request.productId());
        rfq.setSupplierId(request.supplierId());
        rfq.setQuantity(request.quantity());
        rfq.setUnit(request.unit());
        rfq.setMessage(request.message());

        Rfq saved = rfqRepository.save(rfq);

        return new RfqResponse(
                saved.getId(),
                saved.getBuyerId(),
                saved.getProductId(),
                saved.getSupplierId(),
                saved.getQuantity(),
                saved.getUnit(),
                saved.getMessage(),
                saved.getStatus(),
                saved.getCreatedAt()
        );
    }
    public List<RfqResponse> getBuyerRfqs(UUID buyerId) {
        return rfqRepository.findByBuyerIdOrderByCreatedAtDesc(buyerId)
                .stream()
                .map(rfq -> new RfqResponse(
                        rfq.getId(),
                        rfq.getBuyerId(),
                        rfq.getProductId(),
                        rfq.getSupplierId(),
                        rfq.getQuantity(),
                        rfq.getUnit(),
                        rfq.getMessage(),
                        rfq.getStatus(),
                        rfq.getCreatedAt()
                ))
                .toList();
    }


}