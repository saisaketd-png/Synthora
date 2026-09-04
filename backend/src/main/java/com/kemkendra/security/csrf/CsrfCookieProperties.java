package com.kemkendra.security.csrf;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration properties for Spring Security Single-Page Application (SPA) CSRF protection.
 *
 * In Phase C.3-B:
 * - The infrastructure is fully active.
 * - 'enforce' defaults to false to prevent disruption of Bearer-authenticated and transitional C.2 clients.
 * - In Phase C.3-C: 'enforce' will be selectively applied to cookie-authenticated mutations.
 */
@Component
@ConfigurationProperties(prefix = "kemkendra.security.csrf")
public class CsrfCookieProperties {

    /**
     * Whether CSRF infrastructure is enabled.
     */
    private boolean enabled = true;

    /**
     * Whether CSRF validation is actively enforced on requests.
     * In Phase C.3-D, true for scoped enforcement on cookie-authenticated endpoints.
     */
    private boolean enforce = true;

    /**
     * Whether the XSRF-TOKEN cookie requires HTTPS. Aligned with production environment.
     */
    private boolean secure = false;

    /**
     * Name of the client-readable CSRF cookie. Defaults to standard "XSRF-TOKEN".
     */
    private String cookieName = "XSRF-TOKEN";

    /**
     * Name of the HTTP request header expected from SPA clients. Defaults to "X-XSRF-TOKEN".
     */
    private String headerName = "X-XSRF-TOKEN";

    /**
     * Name of the form parameter if applicable. Defaults to "_csrf".
     */
    private String parameterName = "_csrf";

    /**
     * Cookie scope path. Defaults to "/".
     */
    private String path = "/";

    /**
     * SameSite policy for the CSRF cookie.
     */
    private String sameSite = "Strict";

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public boolean isEnforce() {
        return enforce;
    }

    public void setEnforce(boolean enforce) {
        this.enforce = enforce;
    }

    public boolean isSecure() {
        return secure;
    }

    public void setSecure(boolean secure) {
        this.secure = secure;
    }

    public String getCookieName() {
        return cookieName;
    }

    public void setCookieName(String cookieName) {
        this.cookieName = cookieName;
    }

    public String getHeaderName() {
        return headerName;
    }

    public void setHeaderName(String headerName) {
        this.headerName = headerName;
    }

    public String getParameterName() {
        return parameterName;
    }

    public void setParameterName(String parameterName) {
        this.parameterName = parameterName;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public String getSameSite() {
        return sameSite;
    }

    public void setSameSite(String sameSite) {
        this.sameSite = sameSite;
    }
}
