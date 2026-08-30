package com.synthora.security.ratelimit;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "synthora.rate-limit")
public class RateLimitProperties {

    private boolean enabled = true;
    private LimitRule login = new LimitRule(10, 60);
    private LimitRule registration = new LimitRule(10, 60);
    private LimitRule passwordReset = new LimitRule(10, 60);
    private LimitRule emailVerification = new LimitRule(15, 60);
    private LimitRule publicApi = new LimitRule(120, 60);

    public static class LimitRule {
        private int limit;
        private long windowSeconds;

        public LimitRule() {
            this(60, 60);
        }

        public LimitRule(int limit, long windowSeconds) {
            this.limit = limit;
            this.windowSeconds = windowSeconds;
        }

        public int getLimit() {
            return limit;
        }

        public void setLimit(int limit) {
            this.limit = limit;
        }

        public long getWindowSeconds() {
            return windowSeconds;
        }

        public void setWindowSeconds(long windowSeconds) {
            this.windowSeconds = windowSeconds;
        }
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public LimitRule getLogin() {
        return login;
    }

    public void setLogin(LimitRule login) {
        this.login = login;
    }

    public LimitRule getRegistration() {
        return registration;
    }

    public void setRegistration(LimitRule registration) {
        this.registration = registration;
    }

    public LimitRule getPasswordReset() {
        return passwordReset;
    }

    public void setPasswordReset(LimitRule passwordReset) {
        this.passwordReset = passwordReset;
    }

    public LimitRule getEmailVerification() {
        return emailVerification;
    }

    public void setEmailVerification(LimitRule emailVerification) {
        this.emailVerification = emailVerification;
    }

    public LimitRule getPublicApi() {
        return publicApi;
    }

    public void setPublicApi(LimitRule publicApi) {
        this.publicApi = publicApi;
    }

    public LimitRule getRule(RateLimitCategory category) {
        return switch (category) {
            case LOGIN -> login;
            case REGISTRATION -> registration;
            case PASSWORD_RESET -> passwordReset;
            case EMAIL_VERIFICATION -> emailVerification;
            case PUBLIC_API -> publicApi;
            case NONE -> null;
        };
    }
}
