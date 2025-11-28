package me.qwqdev.livestatus.util;

import android.content.Context;
import android.os.PowerManager;

public class ScreenHelper {
    private final PowerManager powerManager;

    public ScreenHelper(Context context) {
        this.powerManager = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
    }

    public boolean isScreenOn() {
        return powerManager == null || powerManager.isInteractive();
    }
}
