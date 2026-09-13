package com.minglemart.scheduler.services;

import org.springframework.stereotype.Service;

import com.minglemart.shared.infra.SmtpMailSender;
import com.minglemart.shared.infra.TemplateRenderer;
import com.minglemart.shared.contracts.NotificationDispatch;

@Service
public class NotificationDeliveryService {
    private final NotificationDispatch dispatch;
    private final TemplateRenderer templates;
    private final SmtpMailSender mail;

    public NotificationDeliveryService(NotificationDispatch dispatch, TemplateRenderer templates, SmtpMailSender mail) {
        this.dispatch = dispatch;
        this.templates = templates;
        this.mail = mail;
    }

    public boolean deliver(NotificationDispatch.Deliverable message) {
        try {
            String html = templates.render(message.templateGroup(), message.templateName(), message.body());

            String providerId = mail.send(new SmtpMailSender.Message(message.recipient(), message.subject(), html));

            dispatch.markSent(message.id(), providerId);
            return true;

        } catch (RuntimeException e) {
            dispatch.markFailed(message.id(), e.getMessage());
            return false;
        }
    }
}
