package com.synthora.rfq.apis;

import com.synthora.rfq.RfqService;
import com.synthora.rfq.dto.CreateRfqRequest;
import com.synthora.rfq.dto.RfqResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;


@RestController
@RequestMapping("/api/v1/rfqs")
public class RfqController {

    private final RfqService rfqService;

    public RfqController(RfqService rfqService) {
        this.rfqService = rfqService;
    }

    @GetMapping("/buyer/{buyerId}")
    public List<RfqResponse> getBuyerRfqs(@PathVariable UUID buyerId) {
        return rfqService.getBuyerRfqs(buyerId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RfqResponse createRfq(@Valid @RequestBody CreateRfqRequest request) {
        return rfqService.createRfq(request);
    }
}