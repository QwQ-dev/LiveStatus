package me.qwqdev.livestatus.model;

import com.google.gson.annotations.SerializedName;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class Status {
    @SerializedName("title")
    private String title;

    @SerializedName("app_name")
    private String appName;

    @SerializedName("os_name")
    private String osName;

    @SerializedName("force_status_type")
    private String forceStatusType;

    public Status(String title, String appName) {
        this(title, appName, "android", "N/A");
    }

    public static Status na() {
        return new Status("N/A", "N/A");
    }

    public static Status screenOff() {
        return new Status("Screen Off", "Screen Off", "android", "N/A");
    }
}
