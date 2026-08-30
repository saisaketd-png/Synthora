package com.synthora.notification.email;

import jakarta.mail.Address;
import jakarta.mail.Session;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;

import java.util.Properties;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class EmailServiceProductionHardeningTest {

    private JavaMailSender mailSender;
    private EmailServiceImpl emailService;

    private static final String FROM_EMAIL = "notifications@synthora.com";
    private static final String FROM_NAME = "Synthora B2B Marketplace";

    @BeforeEach
    void setUp() {
        mailSender = mock(JavaMailSender.class);
        when(mailSender.createMimeMessage()).thenAnswer(invocation ->
                new MimeMessage(Session.getInstance(new Properties()))
        );

        emailService = new EmailServiceImpl(
                mailSender,
                FROM_EMAIL,
                FROM_NAME,
                true // mailEnabled = true
        );
    }

    @Test
    @DisplayName("sendHtmlEmail successfully creates, formats, and dispatches UTF-8 MimeMessage")
    void testSendHtmlEmail_successfulMimeMessageDispatch() throws Exception {
        String recipient = "buyer@enterprise-chem.com";
        String subject = "[KemKendra] Quotation Received for Acetic Acid 99%";
        String htmlBody = "<html><body><h1>Quotation Approved</h1><p>Your chemical RFQ has been accepted.</p></body></html>";

        emailService.sendHtmlEmail(recipient, subject, htmlBody);

        ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender, times(1)).send(captor.capture());

        MimeMessage dispatchedMessage = captor.getValue();
        assertNotNull(dispatchedMessage);

        // Verify Recipient
        Address[] recipients = dispatchedMessage.getRecipients(MimeMessage.RecipientType.TO);
        assertNotNull(recipients);
        assertEquals(1, recipients.length);
        assertEquals(recipient, ((InternetAddress) recipients[0]).getAddress());

        // Verify From Address & Personal Name
        Address[] fromAddresses = dispatchedMessage.getFrom();
        assertNotNull(fromAddresses);
        assertEquals(1, fromAddresses.length);
        InternetAddress from = (InternetAddress) fromAddresses[0];
        assertEquals(FROM_EMAIL, from.getAddress());
        assertEquals(FROM_NAME, from.getPersonal());

        // Verify Subject
        assertEquals(subject, dispatchedMessage.getSubject());

        // Verify Content and Encoding
        String extractedHtml = extractHtmlContent(dispatchedMessage);
        assertTrue(extractedHtml.contains("Quotation Approved"));
        assertTrue(extractedHtml.contains("Your chemical RFQ has been accepted."));
    }

    @Test
    @DisplayName("sendHtmlEmail handles special UTF-8 characters and symbols accurately")
    void testSendHtmlEmail_utf8EncodingIntegrity() throws Exception {
        String recipient = "procurement@chemcorp.de";
        String subject = "[KemKendra] Order Confirmed: €250,000 — 50MT (Ä, Ö, Ü, ß, ™, ©)";
        String htmlBody = "<div><p>Price: €250,000</p><p>Specification: Intermediates & Fine Chemicals — Qualität geprüft.</p></div>";

        emailService.sendHtmlEmail(recipient, subject, htmlBody);

        ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender, times(1)).send(captor.capture());

        MimeMessage dispatchedMessage = captor.getValue();
        assertEquals(subject, dispatchedMessage.getSubject());
        String extractedHtml = extractHtmlContent(dispatchedMessage);
        assertTrue(extractedHtml.contains("€250,000"));
        assertTrue(extractedHtml.contains("Qualität geprüft."));
    }

    private String extractHtmlContent(MimeMessage message) throws Exception {
        Object content = message.getContent();
        if (content instanceof String s) {
            return s;
        } else if (content instanceof jakarta.mail.Multipart mp) {
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < mp.getCount(); i++) {
                jakarta.mail.BodyPart part = mp.getBodyPart(i);
                Object partContent = part.getContent();
                if (partContent instanceof String bodyStr) {
                    sb.append(bodyStr);
                } else if (partContent instanceof jakarta.mail.Multipart nestedMp) {
                    for (int j = 0; j < nestedMp.getCount(); j++) {
                        if (nestedMp.getBodyPart(j).getContent() instanceof String nestedStr) {
                            sb.append(nestedStr);
                        }
                    }
                }
            }
            return sb.toString();
        }
        return content != null ? content.toString() : "";
    }

    @Test
    @DisplayName("sendHtmlEmail skips dispatch when mail is disabled via synthora.mail.enabled=false")
    void testSendHtmlEmail_disabledMailSkipsDispatch() {
        EmailServiceImpl disabledEmailService = new EmailServiceImpl(
                mailSender,
                FROM_EMAIL,
                FROM_NAME,
                false // disabled
        );

        disabledEmailService.sendHtmlEmail("test@example.com", "Subject", "<p>Body</p>");

        verify(mailSender, never()).createMimeMessage();
        verify(mailSender, never()).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("sendHtmlEmail safely skips dispatch when recipient is null or blank")
    void testSendHtmlEmail_nullOrBlankRecipient() {
        emailService.sendHtmlEmail(null, "Subject", "<p>Body</p>");
        emailService.sendHtmlEmail("   ", "Subject", "<p>Body</p>");

        verify(mailSender, never()).createMimeMessage();
        verify(mailSender, never()).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("sendHtmlEmail safely handles null JavaMailSender without throwing exceptions")
    void testSendHtmlEmail_nullMailSenderHandledGracefully() {
        EmailServiceImpl serviceWithNoSender = new EmailServiceImpl(
                null,
                FROM_EMAIL,
                FROM_NAME,
                true
        );

        assertDoesNotThrow(() ->
                serviceWithNoSender.sendHtmlEmail("buyer@example.com", "Subject", "<p>Body</p>")
        );
    }

    @Test
    @DisplayName("sendHtmlEmail isolates SMTP MailSendException and does not throw exception to caller")
    void testSendHtmlEmail_smtpSendExceptionIsolated() {
        doThrow(new MailSendException("Connection timed out: smtp.resend.com:587"))
                .when(mailSender).send(any(MimeMessage.class));

        assertDoesNotThrow(() ->
                emailService.sendHtmlEmail("buyer@example.com", "Subject", "<p>Body</p>")
        );

        verify(mailSender, times(1)).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("sendHtmlEmail isolates SMTP MailAuthenticationException and does not throw exception to caller")
    void testSendHtmlEmail_smtpAuthExceptionIsolated() {
        doThrow(new MailAuthenticationException("535 5.7.8 Authentication credentials invalid"))
                .when(mailSender).send(any(MimeMessage.class));

        assertDoesNotThrow(() ->
                emailService.sendHtmlEmail("buyer@example.com", "Subject", "<p>Body</p>")
        );

        verify(mailSender, times(1)).send(any(MimeMessage.class));
    }
}
