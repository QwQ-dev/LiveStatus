package me.qwqdev.livestatus.util;

import android.content.Context;
import android.content.SharedPreferences;

public class SettingsManager {
    private static final String PREFS_NAME = "livestatus_settings";
    private static final String KEY_URL = "url";
    private static final String KEY_AUTH_KEY = "auth_key";
    private static final String KEY_UPDATE_INTERVAL = "update_interval_secs";
    private static final String KEY_SERVICE_ENABLED = "service_enabled";

    private static final String DEFAULT_URL = "http://127.0.0.1:1239/api/status";
    private static final String DEFAULT_AUTH_KEY = "";
    private static final int DEFAULT_UPDATE_INTERVAL = 5;
    private static final boolean DEFAULT_SERVICE_ENABLED = false;

    private final SharedPreferences prefs;

    public SettingsManager(Context context) {
        this.prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    public String getUrl() {
        return prefs.getString(KEY_URL, DEFAULT_URL);
    }

    public void setUrl(String url) {
        prefs.edit().putString(KEY_URL, url).apply();
    }

    public String getAuthKey() {
        return prefs.getString(KEY_AUTH_KEY, DEFAULT_AUTH_KEY);
    }

    public void setAuthKey(String key) {
        prefs.edit().putString(KEY_AUTH_KEY, key).apply();
    }

    public int getUpdateIntervalSecs() {
        return prefs.getInt(KEY_UPDATE_INTERVAL, DEFAULT_UPDATE_INTERVAL);
    }

    public void setUpdateIntervalSecs(int seconds) {
        prefs.edit().putInt(KEY_UPDATE_INTERVAL, seconds).apply();
    }

    public boolean isServiceEnabled() {
        return prefs.getBoolean(KEY_SERVICE_ENABLED, DEFAULT_SERVICE_ENABLED);
    }

    public void setServiceEnabled(boolean enabled) {
        prefs.edit().putBoolean(KEY_SERVICE_ENABLED, enabled).apply();
    }

    public boolean isConfigured() {
        String url = getUrl();
        String key = getAuthKey();
        return url != null && !url.isEmpty() && key != null && !key.isEmpty();
    }
}
