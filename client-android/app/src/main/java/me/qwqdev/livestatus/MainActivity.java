package me.qwqdev.livestatus;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import com.google.android.material.textfield.TextInputEditText;
import me.qwqdev.livestatus.service.AppDetectorService;
import me.qwqdev.livestatus.service.StatusReporterService;
import me.qwqdev.livestatus.util.SettingsManager;

public class MainActivity extends AppCompatActivity {
    private SettingsManager settingsManager;

    private TextInputEditText urlInput;
    private TextInputEditText keyInput;
    private TextInputEditText intervalInput;
    private TextView statusText;
    private TextView accessibilityStatus;
    private Button startButton;
    private Button stopButton;
    private final ActivityResultLauncher<String> notificationPermissionLauncher =
            registerForActivityResult(new ActivityResultContracts.RequestPermission(), isGranted -> {
                if (isGranted) {
                    startStatusService();
                } else {
                    Toast.makeText(this, "Notification permission is required for the service", Toast.LENGTH_LONG).show();
                }
            });
    private Button accessibilityButton;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        settingsManager = new SettingsManager(this);

        initViews();
        loadSettings();
        setupListeners();
    }

    @Override
    protected void onResume() {
        super.onResume();
        updatePermissionStatus();
        updateServiceStatus();
    }

    private void initViews() {
        urlInput = findViewById(R.id.urlInput);
        keyInput = findViewById(R.id.keyInput);
        intervalInput = findViewById(R.id.intervalInput);
        statusText = findViewById(R.id.statusText);
        accessibilityStatus = findViewById(R.id.accessibilityStatus);
        startButton = findViewById(R.id.startButton);
        stopButton = findViewById(R.id.stopButton);
        accessibilityButton = findViewById(R.id.accessibilityButton);
        Button saveButton = findViewById(R.id.saveButton);

        saveButton.setOnClickListener(v -> saveSettings());
    }

    private void loadSettings() {
        urlInput.setText(settingsManager.getUrl());
        keyInput.setText(settingsManager.getAuthKey());
        intervalInput.setText(String.valueOf(settingsManager.getUpdateIntervalSecs()));
    }

    private void setupListeners() {
        startButton.setOnClickListener(v -> onStartClicked());
        stopButton.setOnClickListener(v -> onStopClicked());
        accessibilityButton.setOnClickListener(v -> requestAccessibilityPermission());
    }

    private void saveSettings() {
        String url = urlInput.getText() != null ? urlInput.getText().toString().trim() : "";
        String key = keyInput.getText() != null ? keyInput.getText().toString().trim() : "";
        String intervalStr = intervalInput.getText() != null ? intervalInput.getText().toString().trim() : "5";

        int interval;
        try {
            interval = Integer.parseInt(intervalStr);
            if (interval < 1) {
                interval = 5;
            }
        } catch (NumberFormatException e) {
            interval = 5;
        }

        settingsManager.setUrl(url);
        settingsManager.setAuthKey(key);
        settingsManager.setUpdateIntervalSecs(interval);

        Toast.makeText(this, R.string.toast_settings_saved, Toast.LENGTH_SHORT).show();
    }

    private void onStartClicked() {
        if (!settingsManager.isConfigured()) {
            Toast.makeText(this, R.string.toast_configure_first, Toast.LENGTH_LONG).show();
            return;
        }

        if (!AppDetectorService.isServiceEnabled(this)) {
            Toast.makeText(this, R.string.toast_grant_permission_first, Toast.LENGTH_LONG).show();
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                    != PackageManager.PERMISSION_GRANTED) {
                notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS);
                return;
            }
        }

        startStatusService();
    }

    private void startStatusService() {
        Intent serviceIntent = new Intent(this, StatusReporterService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent);
        } else {
            startService(serviceIntent);
        }
        settingsManager.setServiceEnabled(true);
        Toast.makeText(this, R.string.toast_service_started, Toast.LENGTH_SHORT).show();
        setServiceStatusUI(true);
    }

    private void onStopClicked() {
        Intent serviceIntent = new Intent(this, StatusReporterService.class);
        stopService(serviceIntent);
        settingsManager.setServiceEnabled(false);
        Toast.makeText(this, R.string.toast_service_stopped, Toast.LENGTH_SHORT).show();
        setServiceStatusUI(false);
    }

    private void requestAccessibilityPermission() {
        Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
        startActivity(intent);
        Toast.makeText(this, "Find and enable 'LiveStatus' in the list", Toast.LENGTH_LONG).show();
    }

    private void updatePermissionStatus() {
        boolean hasAccessibility = AppDetectorService.isServiceEnabled(this);
        if (hasAccessibility) {
            accessibilityStatus.setText(R.string.accessibility_permission_granted);
            accessibilityStatus.setTextColor(ContextCompat.getColor(this, android.R.color.holo_green_dark));
            accessibilityButton.setEnabled(false);
        } else {
            accessibilityStatus.setText(R.string.accessibility_permission_not_granted);
            accessibilityStatus.setTextColor(ContextCompat.getColor(this, android.R.color.holo_red_dark));
            accessibilityButton.setEnabled(true);
        }
    }

    private void updateServiceStatus() {
        setServiceStatusUI(isServiceRunning());
    }

    private void setServiceStatusUI(boolean isRunning) {
        if (isRunning) {
            statusText.setText(R.string.status_running);
            statusText.setTextColor(ContextCompat.getColor(this, android.R.color.holo_green_dark));
            startButton.setEnabled(false);
            stopButton.setEnabled(true);
        } else {
            statusText.setText(R.string.status_stopped);
            statusText.setTextColor(ContextCompat.getColor(this, android.R.color.holo_red_dark));
            startButton.setEnabled(true);
            stopButton.setEnabled(false);
        }
    }

    private boolean isServiceRunning() {
        return StatusReporterService.isServiceRunning();
    }
}
