package com.kuzavpn.vpnmodule;

import java.util.ArrayList;
import java.util.List;

import org.json.JSONObject;

import com.wireguard.android.backend.GoBackend;
import com.wireguard.config.Interface;
import com.wireguard.config.Peer;
import com.wireguard.config.Config;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.VpnService;
import android.os.Build;
import android.os.ParcelFileDescriptor;
import android.util.Log;
import androidx.core.app.NotificationCompat;

/**
 * KuzaVPN Service - WireGuard-based VPN with per-app functionality
 * Implements true per-app VPN routing on Android
 */
public class KuzaVpnService extends VpnService {
    private static final String TAG = "KuzaVpnService";
    private static final String CHANNEL_ID = "KuzaVPN_Channel";
    private static final int NOTIFICATION_ID = 1001;

    public static final String ACTION_CONNECT = "com.kuzavpn.CONNECT";
    public static final String ACTION_DISCONNECT = "com.kuzavpn.DISCONNECT";
    public static final String EXTRA_CONFIG = "vpn_config";
    public static final String EXTRA_SELECTED_APPS = "selected_apps";

    private ParcelFileDescriptor vpnInterface;

    private GoBackend wireguardBackend;
    private boolean isConnected = false;
    private List<String> selectedApps = new ArrayList<>();
    // WireGuard configuration
    private Config wireguardConfig;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        wireguardBackend = new GoBackend(getApplicationContext());
        Log.d(TAG, "KuzaVPN Service created");
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) return START_NOT_STICKY;

        String action = intent.getAction();
        if (ACTION_CONNECT.equals(action)) {
            String configJson = intent.getStringExtra(EXTRA_CONFIG);
            ArrayList<String> apps = intent.getStringArrayListExtra(EXTRA_SELECTED_APPS);
            connectVPN(configJson, apps);
        } else if (ACTION_DISCONNECT.equals(action)) {
            disconnectVPN();
        }

        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        disconnectVPN();
        super.onDestroy();
        Log.d(TAG, "KuzaVPN Service destroyed");
    }

    // Public methods for React Native bridge
    public boolean isConnected() {
        return isConnected;
    }

    public List<String> getSelectedApps() {
        return new ArrayList<>(selectedApps);
    }

    private void connectVPN(String configJson, List<String> apps) {
        try {
            // Parse WireGuard configuration
            wireguardConfig = parseWireGuardConfig(configJson);
            selectedApps = apps != null ? apps : new ArrayList<>();

            // Create VPN interface with per-app routing
            VpnService.Builder builder = new Builder()
                .setSession("KuzaVPN")
                .setMtu(1420)
                .addAddress("10.0.0.2", 24)  // Match your server config
                .addDnsServer("1.1.1.1")
                .addDnsServer("8.8.8.8")
                .addRoute("0.0.0.0", 0);

            // Configure per-app VPN routing
            configureAppRouting(builder);

            // Establish VPN interface
            vpnInterface = builder.establish();

            if (vpnInterface != null) {
                // Start WireGuard tunnel
                startWireGuardTunnel();
                isConnected = true;
                startForeground(NOTIFICATION_ID, createNotification("Connected"));
                Log.d(TAG, "VPN connected with " + selectedApps.size() + " apps");
            } else {
                Log.e(TAG, "Failed to establish VPN interface");
            }

        } catch (Exception e) {
            Log.e(TAG, "Failed to connect VPN", e);
            disconnectVPN();
        }
    }

    private void configureAppRouting(VpnService.Builder builder) {
        try {
            if (selectedApps.isEmpty()) {
                // Encrypt all traffic if no specific apps selected
                Log.d(TAG, "Encrypting all traffic - no app restrictions");
                return;
            }

            // Add selected apps to VPN routing
            for (String packageName : selectedApps) {
                try {
                    builder.addAllowedApplication(packageName);
                    Log.d(TAG, "Added app to VPN: " + packageName);
                } catch (PackageManager.NameNotFoundException e) {
                    Log.w(TAG, "App not found: " + packageName);
                }
            }

            // Exclude this VPN app itself to prevent loops
            builder.addDisallowedApplication(getPackageName());

        } catch (Exception e) {
            Log.e(TAG, "Failed to configure app routing", e);
        }
    }

    private void startWireGuardTunnel() {
        try {
            if (wireguardConfig != null && vpnInterface != null) {
                // Set up WireGuard tunnel with the VPN interface
                int tunnelHandle = wireguardBackend.turnOn(
                    "KuzaVPN",
                    vpnInterface.getFd(),
                    wireguardConfig.toWgQuickString()
                );

                if (tunnelHandle >= 0) {
                    Log.d(TAG, "WireGuard tunnel started successfully");
                } else {
                    throw new Exception("WireGuard tunnel failed to start");
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to start WireGuard tunnel", e);
            throw new RuntimeException(e);
        }
    }

    private void disconnectVPN() {
        try {
            isConnected = false;

            // Stop WireGuard tunnel
            if (wireguardBackend != null) {
                wireguardBackend.turnOff("KuzaVPN");
            }

            // Close VPN interface
            if (vpnInterface != null) {
                vpnInterface.close();
                vpnInterface = null;
            }

            stopForeground(true);
            stopSelf();

            Log.d(TAG, "VPN disconnected");

        } catch (Exception e) {
            Log.e(TAG, "Error disconnecting VPN", e);
        }
    }

    private Config parseWireGuardConfig(String configJson) {
        try {
            // Parse JSON config from React Native
            JSONObject json = new JSONObject(configJson);
            
            String privateKey = json.getString("privateKey");
            String publicKey = json.getString("publicKey");
            String serverEndpoint = json.getString("serverEndpoint");
            
            // Use your actual WireGuard configuration
            Interface.Builder interfaceBuilder = new Interface.Builder()
                .parsePrivateKey(privateKey)
                .parseAddresses("10.0.0.2/24")
                .parseDnsServers("1.1.1.1, 8.8.8.8");

            Peer.Builder peerBuilder = new Peer.Builder()
                .parsePublicKey(publicKey)
                .parseEndpoint(serverEndpoint)
                .parseAllowedIPs("0.0.0.0/0, ::/0")
                .parsePersistentKeepalive("25");

            return new Config.Builder()
                .setInterface(interfaceBuilder.build())
                .addPeer(peerBuilder.build())
                .build();

        } catch (Exception e) {
            Log.e(TAG, "Failed to parse WireGuard config", e);
            throw new RuntimeException(e);
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "KuzaVPN Service",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("VPN connection status");

            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(channel);
        }
    }

    private Notification createNotification(String status) {
        Intent notificationIntent = new Intent(this, KuzaVpnService.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 0, notificationIntent, PendingIntent.FLAG_IMMUTABLE
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("KuzaVPN")
            .setContentText("Status: " + status)
            .setSmallIcon(android.R.drawable.ic_lock_power_off)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build();
    }
}
