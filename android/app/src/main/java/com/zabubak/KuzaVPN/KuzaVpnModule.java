package com.zabubak.KuzaVPN;

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

import android.app.Activity;
import android.content.Intent;
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

                // TODO: Wait for service to confirm connection
                // For now, assume success
                promise.resolve(true);

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
                    
                    appInfo.putString("icon", ""); // TODO: Convert icon to base64 if needed
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
            // TODO: Implement actual bandwidth monitoring
            WritableMap stats = Arguments.createMap();
            stats.putDouble("uploaded", 1024 * 1024 * 50); // 50 MB
            stats.putDouble("downloaded", 1024 * 1024 * 200); // 200 MB
            stats.putDouble("total", 1024 * 1024 * 250); // 250 MB
            
            promise.resolve(stats);

        } catch (Exception e) {
            Log.e(TAG, "Failed to get bandwidth stats", e);
            promise.reject("GET_BANDWIDTH_ERROR", e.getMessage());
        }
    }
}
