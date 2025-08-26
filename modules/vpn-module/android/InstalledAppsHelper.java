package com.kuzavpn.vpnmodule;

import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.Drawable;
import android.util.Log;

/**
 * Helper class for managing installed applications
 * Provides functionality to enumerate and filter installed apps
 */
public class InstalledAppsHelper {
    private static final String TAG = "InstalledAppsHelper";

    private final Context context;
    private final PackageManager packageManager;

    public InstalledAppsHelper(Context context) {
        this.context = context;
        this.packageManager = context.getPackageManager();
    }

    /**
     * Get all user-installed applications as JSON
     * Filters out system apps and returns only user-installed apps
     */
    public String getInstalledApps() {
        try {
            List<ApplicationInfo> installedApps = packageManager.getInstalledApplications(PackageManager.GET_META_DATA);
            JSONArray appsArray = new JSONArray();

            // Filter and sort apps
            List<ApplicationInfo> userApps = filterUserApps(installedApps);
            sortAppsByName(userApps);

            for (ApplicationInfo appInfo : userApps) {
                try {
                    JSONObject appJson = createAppJson(appInfo);
                    if (appJson != null) {
                        appsArray.put(appJson);
                    }
                } catch (Exception e) {
                    Log.w(TAG, "Failed to process app: " + appInfo.packageName, e);
                }
            }

            Log.d(TAG, "Found " + appsArray.length() + " user apps");
            return appsArray.toString();

        } catch (Exception e) {
            Log.e(TAG, "Failed to get installed apps", e);
            return "[]";
        }
    }

    /**
     * Check if a specific app is installed
     */
    public boolean isAppInstalled(String packageName) {
        try {
            packageManager.getPackageInfo(packageName, PackageManager.GET_ACTIVITIES);
            return true;
        } catch (PackageManager.NameNotFoundException e) {
            return false;
        }
    }

    /**
     * Get specific app info as JSON
     */
    public String getAppInfo(String packageName) {
        try {
            ApplicationInfo appInfo = packageManager.getApplicationInfo(packageName, PackageManager.GET_META_DATA);
            JSONObject appJson = createAppJson(appInfo);
            return appJson != null ? appJson.toString() : null;
        } catch (Exception e) {
            Log.e(TAG, "Failed to get app info for: " + packageName, e);
            return null;
        }
    }

    /**
     * Get popular apps that are commonly used with VPNs
     */
    public String getPopularApps() {
        String[] popularPackages = {
            "com.whatsapp",
            "com.instagram.android",
            "com.snapchat.android",
            "com.zhiliaoapp.musically", // TikTok
            "com.twitter.android",
            "com.facebook.katana",
            "com.spotify.music",
            "com.netflix.mediaclient",
            "com.google.android.youtube",
            "com.discord"
        };

        JSONArray popularApps = new JSONArray();

        for (String packageName : popularPackages) {
            if (isAppInstalled(packageName)) {
                String appInfo = getAppInfo(packageName);
                if (appInfo != null) {
                    try {
                        popularApps.put(new JSONObject(appInfo));
                    } catch (JSONException e) {
                        Log.w(TAG, "Failed to add popular app: " + packageName);
                    }
                }
            }
        }

        return popularApps.toString();
    }

    /**
     * Filter to get only user-installed apps (not system apps)
     */
    private List<ApplicationInfo> filterUserApps(List<ApplicationInfo> allApps) {
        List<ApplicationInfo> userApps = new ArrayList<>();

        for (ApplicationInfo appInfo : allApps) {
            // Skip system apps and this VPN app
            if (isUserApp(appInfo) && !isVpnApp(appInfo)) {
                userApps.add(appInfo);
            }
        }

        return userApps;
    }

    /**
     * Check if app is user-installed (not system app)
     */
    private boolean isUserApp(ApplicationInfo appInfo) {
        return (appInfo.flags & ApplicationInfo.FLAG_SYSTEM) == 0 ||
               (appInfo.flags & ApplicationInfo.FLAG_UPDATED_SYSTEM_APP) != 0;
    }

    /**
     * Check if app is this VPN app (to exclude it)
     */
    private boolean isVpnApp(ApplicationInfo appInfo) {
        return context.getPackageName().equals(appInfo.packageName);
    }

    /**
     * Sort apps alphabetically by name
     */
    private void sortAppsByName(List<ApplicationInfo> apps) {
        Collections.sort(apps, new Comparator<ApplicationInfo>() {
            @Override
            public int compare(ApplicationInfo app1, ApplicationInfo app2) {
                String name1 = getAppName(app1);
                String name2 = getAppName(app2);
                return name1.compareToIgnoreCase(name2);
            }
        });
    }

    /**
     * Create JSON object for an app
     */
    private JSONObject createAppJson(ApplicationInfo appInfo) {
        try {
            JSONObject appJson = new JSONObject();

            appJson.put("packageName", appInfo.packageName);
            appJson.put("appName", getAppName(appInfo));
            appJson.put("isSystemApp", (appInfo.flags & ApplicationInfo.FLAG_SYSTEM) != 0);

            // Get app icon as base64 (optional - can be resource intensive)
            String iconBase64 = getAppIconBase64(appInfo);
            if (iconBase64 != null) {
                appJson.put("iconBase64", iconBase64);
            }

            return appJson;

        } catch (JSONException e) {
            Log.e(TAG, "Failed to create JSON for app: " + appInfo.packageName, e);
            return null;
        }
    }

    /**
     * Get human-readable app name
     */
    private String getAppName(ApplicationInfo appInfo) {
        try {
            CharSequence appName = packageManager.getApplicationLabel(appInfo);
            return appName != null ? appName.toString() : appInfo.packageName;
        } catch (Exception e) {
            Log.w(TAG, "Failed to get app name for: " + appInfo.packageName);
            return appInfo.packageName;
        }
    }

    /**
     * Get app icon as base64 encoded string (optional)
     * Note: This can be resource intensive for large numbers of apps
     */
    private String getAppIconBase64(ApplicationInfo appInfo) {
        try {
            Drawable icon = packageManager.getApplicationIcon(appInfo);
            if (icon == null) return null;

            // Convert drawable to bitmap
            Bitmap bitmap = drawableToBitmap(icon);
            if (bitmap == null) return null;

            // Compress and encode to base64
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            bitmap.compress(Bitmap.CompressFormat.PNG, 50, outputStream); // Reduce quality for size
            byte[] iconBytes = outputStream.toByteArray();

            return Base64.encodeToString(iconBytes, Base64.DEFAULT);

        } catch (Exception e) {
            Log.w(TAG, "Failed to get icon for: " + appInfo.packageName);
            return null;
        }
    }

    /**
     * Convert Drawable to Bitmap
     */
    private Bitmap drawableToBitmap(Drawable drawable) {
        try {
            int width = Math.max(drawable.getIntrinsicWidth(), 1);
            int height = Math.max(drawable.getIntrinsicHeight(), 1);

            // Limit icon size to reduce memory usage
            int maxSize = 64;
            if (width > maxSize || height > maxSize) {
                float scale = Math.min((float) maxSize / width, (float) maxSize / height);
                width = (int) (width * scale);
                height = (int) (height * scale);
            }

            Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
            Canvas canvas = new Canvas(bitmap);
            drawable.setBounds(0, 0, width, height);
            drawable.draw(canvas);

            return bitmap;
        } catch (Exception e) {
            Log.w(TAG, "Failed to convert drawable to bitmap", e);
            return null;
        }
    }
}
