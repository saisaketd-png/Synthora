package com.kemkendra.notification.email;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Dedicated Spring-managed component for asynchronous email dispatch.
 *
 * WHY A SEPARATE BEAN:
 * Spring @Async works by wrapping the bean in a proxy. When EmailServiceImpl calls
 * this.sendHtmlEmail() directly (self-call), it bypasses the proxy and @Async never fires.
 * By delegating to this separate bean, Spring's AOP proxy intercepts the call and
 * schedules it on the emailTaskExecutor thread pool correctly.
 */
@Component
public class AsyncEmailDispatcher {

    private static final Logger log = LoggerFactory.getLogger(AsyncEmailDispatcher.class);

    private final EmailService emailService;

    public AsyncEmailDispatcher(EmailService emailService) {
        this.emailService = emailService;
    }

    /**
     * Dispatches an HTML email on the emailTaskExecutor background thread pool.
     * Returns immediately without blocking the caller.
     */
    @Async("emailTaskExecutor")
    public void dispatch(String to, String subject, String htmlBody) {
        log.debug("AsyncEmailDispatcher: dispatching email to {} on thread {}", to, Thread.currentThread().getName());
        emailService.sendHtmlEmail(to, subject, htmlBody);
    }
}
