package com.minglemart.shared.infra;

import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.nio.charset.StandardCharsets;
import jakarta.mail.internet.MimeMessage;
import org.springframework.stereotype.Component;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.MimeMessageHelper;

@Component
public class SmtpMailSender {

    private static final Logger log = LoggerFactory.getLogger(SmtpMailSender.class);

    private final JavaMailSender mailSender;
    private final String from;
    private final String fromName;

    public SmtpMailSender(
        JavaMailSender mailSender,

        @Value("${minglemart.mail.from:no-reply@minglemart.local}")
        String from,

        @Value("${minglemart.mail.from-name:MingleMart}")
        String fromName
    ) {
        this.mailSender = mailSender;
        this.from = from;
        this.fromName = fromName;
    }

    public String send(Message message) {
        try {
            MimeMessage mime = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mime, false, StandardCharsets.UTF_8.name());

            helper.setFrom(from, fromName);
            helper.setTo(message.to());
            helper.setSubject(message.subject());
            helper.setText(message.htmlBody(), true);

            mailSender.send(mime);

            String id = mime.getMessageID();
            log.debug("sent mail to {}", message.to());

            return id != null ? id : "smtp-" + UUID.randomUUID();

        } catch (Exception failure) {
            throw new DeliveryException("SMTP delivery to %s failed".formatted(message.to()), failure);
        }
    }

    public record Message(String to, String subject, String htmlBody) {
    }

    public static class DeliveryException extends RuntimeException {
        public DeliveryException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
