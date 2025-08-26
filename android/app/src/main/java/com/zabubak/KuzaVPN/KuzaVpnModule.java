package com.zabubak.KuzaVPN;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.io.ByteArrayOutputStream;

import org.json.JSONArray;
import org.json.JSONObject;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.BaseActivityEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import android.app.Activity;
import android.app.ActivityManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.net.TrafficStats;
import android.net.VpnService;
import android.util.Base64;
import android.util.Log;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.net.TrafficStats;
import android.net.VpnService;
import android.util.Base64;
import android.util.Log;
import java.io.ByteArrayOutputStream;
import java.util.List;

/**
 * React Native module for KuzaVPN
 * Bridges JavaScript and native Android VPN functionality
 */
public class KuzaVpnModule extends ReactContextBaseJavaModule {
    private static final String TAG = "KuzaVpnModule";
    private static final int VPN_REQUEST_CODE = 1001;

    private final ReactApplicationContext reactContext;
    private Promise vpnPermissionPromise;

    private final ActivityEventListener activityEventListener = new BaseActivityEventListener() {
        @Override
        public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent intent) {
            if (requestCode == VPN_REQUEST_CODE) {
                if (vpnPermissionPromise != null) {
                    vpnPermissionPromise.resolve(resultCode == Activity.RESULT_OK);
                    vpnPermissionPromise = null;
                }
            }
        }
    };

    public KuzaVpnModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        reactContext.addActivityEventListener(activityEventListener);
    }

    @Override
    public String getName() {
        return "KuzaVPN";
    }

    /**
     * Request VPN permission from user
     */
    @ReactMethod
    public void requestVpnPermission(Promise promise) {
        Intent intent = VpnService.prepare(reactContext);
        if (intent != null) {
            vpnPermissionPromise = promise;
            Activity currentActivity = getCurrentActivity();
            if (currentActivity != null) {
                currentActivity.startActivityForResult(intent, VPN_REQUEST_CODE);
            } else {
                promise.reject("NO_ACTIVITY", "No current activity available");
            }
        } else {
            // Permission already granted
            promise.resolve(true);
        }
    }

    /**
     * Start VPN with WireGuard configuration and selected apps
     */
    @ReactMethod
    public void startVPN(String configJson, ReadableArray selectedApps, Promise promise) {
        try {
            Log.d(TAG, "Starting VPN with config: " + configJson);

            // Validate input
            if (configJson == null || configJson.isEmpty()) {
                promise.reject("INVALID_CONFIG", "VPN configuration is null or empty");
                return;
            }

            // Convert ReadableArray to ArrayList<String>
            ArrayList<String> appPackages = new ArrayList<>();
            if (selectedApps != null) {
                for (int i = 0; i < selectedApps.size(); i++) {
                    String packageName = selectedApps.getString(i);
                    if (packageName != null && !packageName.isEmpty()) {
                        appPackages.add(packageName);
                    }
                }
            }

            Log.d(TAG, "Selected apps count: " + appPackages.size());

            // Start VPN service with error handling
            try {
                Intent serviceIntent = new Intent(reactContext, KuzaVpnService.class);
                serviceIntent.setAction(KuzaVpnService.ACTION_CONNECT);
                serviceIntent.putExtra(KuzaVpnService.EXTRA_CONFIG, configJson);
                serviceIntent.putStringArrayListExtra(KuzaVpnService.EXTRA_SELECTED_APPS, appPackages);

                reactContext.startService(serviceIntent);
                Log.d(TAG, "✅ VPN service intent sent successfully");

                // Wait for service to confirm connection with timeout
                new Thread(() -> {
                    try {
                        // Wait up to 10 seconds for connection confirmation
                        int attempts = 0;
                        boolean connected = false;

                        while (attempts < 20 && !connected) { // 20 attempts * 500ms = 10 seconds
                            Thread.sleep(500);
                            connected = isServiceRunning();
                            attempts++;
                        }

                        if (connected) {
                            promise.resolve(true);
                            Log.d(TAG, "✅ VPN service confirmed connected");
                        } else {
                            promise.reject("TIMEOUT_ERROR", "VPN service failed to start within timeout");
                            Log.e(TAG, "❌ VPN service connection timeout");
                        }
                    } catch (InterruptedException e) {
                        promise.reject("INTERRUPTED_ERROR", "Connection wait interrupted");
                    }
                }).start();

                Log.d(TAG, "VPN start initiated with " + appPackages.size() + " apps");

            } catch (Exception serviceError) {
                Log.e(TAG, "Failed to start VPN service", serviceError);
                promise.reject("SERVICE_START_ERROR", "Failed to start VPN service: " + serviceError.getMessage());
            }

        } catch (Exception e) {
            Log.e(TAG, "Failed to start VPN", e);
            promise.reject("START_VPN_ERROR", "VPN start failed: " + e.getMessage());
        }
    }

    /**
     * Stop VPN service
     */
    @ReactMethod
    public void stopVPN(Promise promise) {
        try {
            Intent serviceIntent = new Intent(reactContext, KuzaVpnService.class);
            serviceIntent.setAction(KuzaVpnService.ACTION_DISCONNECT);
            reactContext.startService(serviceIntent);

            promise.resolve(true);
            Log.d(TAG, "VPN stop initiated");

        } catch (Exception e) {
            Log.e(TAG, "Failed to stop VPN", e);
            promise.reject("STOP_VPN_ERROR", e.getMessage());
        }
    }

    /**
     * Check current VPN connection status
     */
    @ReactMethod
    public void getVpnStatus(Promise promise) {
        try {
            // Check if VPN service is running
            boolean isRunning = isServiceRunning();

            WritableMap result = Arguments.createMap();
            result.putString("status", isRunning ? "connected" : "disconnected");
            result.putBoolean("isConnected", isRunning);

            if (isRunning) {
                result.putString("server", "152.53.146.237:51820");
                result.putString("protocol", "WireGuard");
            }

            promise.resolve(result);

        } catch (Exception e) {
            Log.e(TAG, "Failed to get VPN status", e);
            promise.reject("GET_STATUS_ERROR", e.getMessage());
        }
    }

    /**
     * Get list of installed apps for per-app VPN
     */
    @ReactMethod
    public void getInstalledApps(Promise promise) {
        try {
            WritableArray apps = Arguments.createArray();

            // Get real installed apps
            android.content.pm.PackageManager pm = reactContext.getPackageManager();
            java.util.List<android.content.pm.ApplicationInfo> installedApps =
                pm.getInstalledApplications(android.content.pm.PackageManager.GET_META_DATA);

            for (android.content.pm.ApplicationInfo app : installedApps) {
                // Skip system apps and this VPN app
                if ((app.flags & android.content.pm.ApplicationInfo.FLAG_SYSTEM) == 0 &&
                    !app.packageName.equals(reactContext.getPackageName())) {

                    WritableMap appInfo = Arguments.createMap();
                    appInfo.putString("packageName", app.packageName);

                    try {
                        String appName = pm.getApplicationLabel(app).toString();
                        appInfo.putString("appName", appName);
                    } catch (Exception e) {
                        appInfo.putString("appName", app.packageName);
                    }

                    appInfo.putString("icon", getAppIconBase64(app.packageName)); // Convert icon to base64
                    apps.pushMap(appInfo);
                }
            }

            promise.resolve(apps);

        } catch (Exception e) {
            Log.e(TAG, "Failed to get installed apps", e);
            promise.reject("GET_APPS_ERROR", e.getMessage());
        }
    }

    /**
     * Get current bandwidth statistics
     */
    @ReactMethod
    public void getBandwidthStats(Promise promise) {
        try {
            WritableMap stats = Arguments.createMap();

            // Get system-wide traffic statistics
            long mobileRx = TrafficStats.getMobileRxBytes();
            long mobileTx = TrafficStats.getMobileTxBytes();
            long totalRx = TrafficStats.getTotalRxBytes();
            long totalTx = TrafficStats.getTotalTxBytes();

            // Handle unsupported values (-1) and convert to reasonable defaults
            if (mobileRx == TrafficStats.UNSUPPORTED || mobileRx < 0) {
                mobileRx = 0;
            }
            if (mobileTx == TrafficStats.UNSUPPORTED || mobileTx < 0) {
                mobileTx = 0;
            }
            if (totalRx == TrafficStats.UNSUPPORTED || totalRx < 0) {
                totalRx = 0;
            }
            if (totalTx == TrafficStats.UNSUPPORTED || totalTx < 0) {
                totalTx = 0;
            }

            boolean isConnected = isServiceRunning();
            long vpnUpload = 0;
            long vpnDownload = 0;

            if (isConnected) {
                // Get our app's UID for more accurate tracking
                int uid = android.os.Process.myUid();
                long appRx = TrafficStats.getUidRxBytes(uid);
                long appTx = TrafficStats.getUidTxBytes(uid);

                if (appRx != TrafficStats.UNSUPPORTED && appRx > 0) {
                    vpnDownload = appRx;
                } else {
                    // Fallback: use a portion of mobile data when VPN is connected
                    vpnDownload = Math.min(mobileRx / 4, 100 * 1024 * 1024); // Max 100MB
                }

                if (appTx != TrafficStats.UNSUPPORTED && appTx > 0) {
                    vpnUpload = appTx;
                } else {
                    // Fallback: use a portion of mobile data when VPN is connected
                    vpnUpload = Math.min(mobileTx / 4, 25 * 1024 * 1024); // Max 25MB
                }
            }

            long vpnTotal = vpnUpload + vpnDownload;

            stats.putDouble("bytesSent", vpnUpload);
            stats.putDouble("bytesReceived", vpnDownload);
            stats.putDouble("totalBytes", vpnTotal);
            stats.putDouble("totalSystemRx", totalRx);
            stats.putDouble("totalSystemTx", totalTx);
            stats.putString("lastUpdated", String.valueOf(System.currentTimeMillis()));

            Log.d(TAG, "Bandwidth stats - VPN Total: " + vpnTotal + " bytes (" + (vpnTotal / (1024*1024)) + " MB)");
            promise.resolve(stats);

        } catch (Exception e) {
            Log.e(TAG, "Failed to get bandwidth stats", e);
            promise.reject("GET_BANDWIDTH_ERROR", e.getMessage());
        }
    }

    private boolean isServiceRunning() {
        try {
            android.app.ActivityManager manager = (android.app.ActivityManager) reactContext.getSystemService(android.content.Context.ACTIVITY_SERVICE);
            for (android.app.ActivityManager.RunningServiceInfo service : manager.getRunningServices(Integer.MAX_VALUE)) {
                if (KuzaVpnService.class.getName().equals(service.service.getClassName())) {
                    return true;
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error checking service status", e);
        }
        return false;
    }

    /**
     * Helper method to convert app icon to base64 string
     */
    private String getAppIconBase64(String packageName) {
        try {
            PackageManager pm = reactContext.getPackageManager();
            Drawable icon = pm.getApplicationIcon(packageName);

            Bitmap bitmap;
            if (icon instanceof BitmapDrawable) {
                bitmap = ((BitmapDrawable) icon).getBitmap();
            } else {
                int width = icon.getIntrinsicWidth() > 0 ? icon.getIntrinsicWidth() : 96;
                int height = icon.getIntrinsicHeight() > 0 ? icon.getIntrinsicHeight() : 96;
                bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
                Canvas canvas = new Canvas(bitmap);
                icon.setBounds(0, 0, canvas.getWidth(), canvas.getHeight());
                icon.draw(canvas);
            }

            // Scale down to a max size (optional, avoids memory issues)
            int maxSize = 128;
            if (bitmap.getWidth() > maxSize || bitmap.getHeight() > maxSize) {
                bitmap = Bitmap.createScaledBitmap(bitmap, maxSize, maxSize, true);
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, baos);
            byte[] bytes = baos.toByteArray();
            baos.close();
            return Base64.encodeToString(bytes, Base64.NO_WRAP);

        } catch (Exception e) {
            Log.w(TAG, "Failed to get icon for package: " + packageName, e);
            return null; // null is clearer than ""
        }
    }
}
