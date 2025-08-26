package com.kuzavpn.vpnmodule;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

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
import com.kuzavpn.vpnmodule.InstalledAppsHelper;
import com.kuzavpn.vpnmodule.KuzaVpnService;

import android.app.Activity;
import android.app.ActivityManager;
import android.content.Context;
import android.content.Intent;
import android.net.TrafficStats;
import android.net.VpnService;
import android.util.Log;

/**
 * React Native module for KuzaVPN
 * Bridges JavaScript and native Android VPN functionality
 */
public class KuzaVpnModule extends ReactContextBaseJavaModule {
    private static final String TAG = "KuzaVpnModule";
    private static final int VPN_REQUEST_CODE = 1001;

    private final ReactApplicationContext reactContext;
    private InstalledAppsHelper appsHelper;
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
        this.appsHelper = new InstalledAppsHelper(reactContext);
        reactContext.addActivityEventListener(activityEventListener);
    }

    @Override
    public String getName() {
        return "KuzaVPN";  // Changed from "KuzaVpnModule" to match React Native imports
    }

    @Override
    public Map<String, Object> getConstants() {
        final Map<String, Object> constants = new HashMap<>();
        constants.put("STATUS_CONNECTED", "connected");
        constants.put("STATUS_DISCONNECTED", "disconnected");
        constants.put("STATUS_CONNECTING", "connecting");
        return constants;
    }

    /**
     * Request VPN permission from user
     * Required before starting VPN service
     */
    @ReactMethod
    public void requestVPNPermission(Promise promise) {
        try {
            Intent vpnIntent = VpnService.prepare(reactContext);

            if (vpnIntent != null) {
                // Permission needed - show system dialog
                vpnPermissionPromise = promise;
                Activity currentActivity = getCurrentActivity();
                if (currentActivity != null) {
                    currentActivity.startActivityForResult(vpnIntent, VPN_REQUEST_CODE);
                } else {
                    promise.reject("NO_ACTIVITY", "No current activity available");
                }
            } else {
                // Permission already granted
                promise.resolve(true);
            }

        } catch (Exception e) {
            Log.e(TAG, "Failed to request VPN permission", e);
            promise.reject("PERMISSION_ERROR", e.getMessage());
        }
    }

    /**
     * Start VPN with WireGuard configuration and selected apps
     */
    @ReactMethod
    public void startVPN(String configJson, ReadableArray selectedApps, Promise promise) {
        try {
            // Convert ReadableArray to ArrayList<String>
            ArrayList<String> appPackages = new ArrayList<>();
            for (int i = 0; i < selectedApps.size(); i++) {
                appPackages.add(selectedApps.getString(i));
            }

            // Start VPN service
            Intent serviceIntent = new Intent(reactContext, KuzaVpnService.class);
            serviceIntent.setAction(KuzaVpnService.ACTION_CONNECT);
            serviceIntent.putExtra(KuzaVpnService.EXTRA_CONFIG, configJson);
            serviceIntent.putStringArrayListExtra(KuzaVpnService.EXTRA_SELECTED_APPS, appPackages);

            reactContext.startService(serviceIntent);

            // Wait for service to confirm connection with timeout
            new Thread(() -> {
                try {
                    // Wait up to 10 seconds for connection confirmation
                    int attempts = 0;
                    boolean connected = false;

                    while (attempts < 20 && !connected) { // 20 attempts * 500ms = 10 seconds
                        Thread.sleep(500);
                        connected = isVpnServiceRunning();
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

        } catch (Exception e) {
            Log.e(TAG, "Failed to start VPN", e);
            promise.reject("START_VPN_ERROR", e.getMessage());
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
     * Get current VPN status
     */
    @ReactMethod
    public void getVPNStatus(Promise promise) {
        try {
            // Implement actual status checking
            boolean isRunning = isVpnServiceRunning();

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
            promise.reject("STATUS_ERROR", e.getMessage());
        }
    }

    /**
     * Get list of installed applications
     */
    @ReactMethod
    public void getInstalledApps(Promise promise) {
        try {
            String appsJson = appsHelper.getInstalledApps();
            WritableArray apps = convertJsonArrayToWritableArray(appsJson);
            promise.resolve(apps);

            Log.d(TAG, "Retrieved installed apps list");

        } catch (Exception e) {
            Log.e(TAG, "Failed to get installed apps", e);
            promise.reject("APPS_ERROR", e.getMessage());
        }
    }

    /**
     * Get list of popular/recommended applications
     */
    @ReactMethod
    public void getPopularApps(Promise promise) {
        try {
            String appsJson = appsHelper.getPopularApps();
            WritableArray apps = convertJsonArrayToWritableArray(appsJson);
            promise.resolve(apps);

        } catch (Exception e) {
            Log.e(TAG, "Failed to get popular apps", e);
            promise.reject("POPULAR_APPS_ERROR", e.getMessage());
        }
    }

    /**
     * Check if specific app is installed
     */
    @ReactMethod
    public void isAppInstalled(String packageName, Promise promise) {
        try {
            boolean isInstalled = appsHelper.isAppInstalled(packageName);
            promise.resolve(isInstalled);

        } catch (Exception e) {
            Log.e(TAG, "Failed to check app installation: " + packageName, e);
            promise.reject("APP_CHECK_ERROR", e.getMessage());
        }
    }

    /**
     * Get bandwidth usage statistics
     * Implements actual bandwidth monitoring using TrafficStats
     */
    @ReactMethod
    public void getBandwidthStats(Promise promise) {
        try {
            // Implement actual bandwidth monitoring using TrafficStats
            WritableMap stats = Arguments.createMap();

            // Get system-wide traffic statistics
            long mobileRx = TrafficStats.getMobileRxBytes();
            long mobileTx = TrafficStats.getMobileTxBytes();
            long totalRx = TrafficStats.getTotalRxBytes();
            long totalTx = TrafficStats.getTotalTxBytes();

            // Calculate totals
            long totalMobile = mobileRx + mobileTx;

            stats.putDouble("bytesReceived", mobileRx > 0 ? mobileRx : 0);
            stats.putDouble("bytesSent", mobileTx > 0 ? mobileTx : 0);
            stats.putDouble("totalBytes", totalMobile > 0 ? totalMobile : 0);
            stats.putDouble("totalSystemRx", totalRx);
            stats.putDouble("totalSystemTx", totalTx);
            stats.putString("lastUpdated", String.valueOf(System.currentTimeMillis()));

            promise.resolve(stats);

        } catch (Exception e) {
            Log.e(TAG, "Failed to get bandwidth stats", e);
            promise.reject("BANDWIDTH_ERROR", e.getMessage());
        }
    }

    /**
     * Helper method to convert JSON array string to WritableArray
     */
    private WritableArray convertJsonArrayToWritableArray(String jsonArrayString) throws Exception {
        JSONArray jsonArray = new JSONArray(jsonArrayString);
        WritableArray writableArray = Arguments.createArray();

        for (int i = 0; i < jsonArray.length(); i++) {
            JSONObject jsonObject = jsonArray.getJSONObject(i);
            WritableMap map = Arguments.createMap();

            map.putString("packageName", jsonObject.getString("packageName"));
            map.putString("appName", jsonObject.getString("appName"));
            map.putBoolean("isSystemApp", jsonObject.getBoolean("isSystemApp"));

            if (jsonObject.has("iconBase64")) {
                map.putString("iconBase64", jsonObject.getString("iconBase64"));
            }

            writableArray.pushMap(map);
        }

        return writableArray;
    }

    /**
     * Helper method to check if VPN service is running
     */
    private boolean isVpnServiceRunning() {
        try {
            ActivityManager manager = (ActivityManager) reactContext.getSystemService(Context.ACTIVITY_SERVICE);
            for (ActivityManager.RunningServiceInfo service : manager.getRunningServices(Integer.MAX_VALUE)) {
                if (KuzaVpnService.class.getName().equals(service.service.getClassName())) {
                    return true;
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "Failed to check service status", e);
        }
        return false;
    }
}
