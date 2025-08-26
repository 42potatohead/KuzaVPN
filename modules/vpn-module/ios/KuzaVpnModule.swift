//
//  KuzaVpnModule.swift
//  KuzaVPN Native Module for React Native
//
//  Created by KuzaVPN Team
//  Copyright © 2024 KuzaVPN. All rights reserved.
//

import Foundation
import React
import NetworkExtension
import WireGuardKit

@objc(KuzaVpnModule)
class KuzaVpnModule: RCTEventEmitter {

    // Shared tunnel provider manager
    private var tunnelProviderManager: NETunnelProviderManager?
    private var appDomainMapper: AppDomainMapper

    // VPN status tracking
    private var currentStatus: NEVPNStatus = .disconnected

    // Constants for React Native
    static let STATUS_CONNECTED = "connected"
    static let STATUS_DISCONNECTED = "disconnected"
    static let STATUS_CONNECTING = "connecting"

    override init() {
        self.appDomainMapper = AppDomainMapper()
        super.init()

        // Setup VPN status observer
        setupVPNStatusObserver()
    }

    // MARK: - React Native Bridge Setup

    override static func requiresMainQueueSetup() -> Bool {
        return true
    }

    override func supportedEvents() -> [String]! {
        return ["VPNStatusChanged", "BandwidthUpdated", "VPNError"]
    }

    override func constantsToExport() -> [AnyHashable : Any]! {
        return [
            "STATUS_CONNECTED": KuzaVpnModule.STATUS_CONNECTED,
            "STATUS_DISCONNECTED": KuzaVpnModule.STATUS_DISCONNECTED,
            "STATUS_CONNECTING": KuzaVpnModule.STATUS_CONNECTING
        ]
    }

    // MARK: - VPN Control Methods

    @objc(requestVPNPermission:rejecter:)
    func requestVPNPermission(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {

        DispatchQueue.main.async {
            // Load existing configuration or create new one
            NETunnelProviderManager.loadAllFromPreferences { [weak self] (managers, error) in
                if let error = error {
                    reject("VPN_PERMISSION_ERROR", "Failed to load VPN preferences: \(error.localizedDescription)", error)
                    return
                }

                // Check if we already have permission
                if let manager = managers?.first {
                    self?.tunnelProviderManager = manager
                    resolve(true)
                } else {
                    // Create new manager to request permission
                    self?.createTunnelProviderManager { success in
                        resolve(success)
                    }
                }
            }
        }
    }

    @objc(startVPN:selectedApps:resolver:rejecter:)
    func startVPN(config: String, selectedApps: [String], resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {

        guard let configData = config.data(using: .utf8),
              let configDict = try? JSONSerialization.jsonObject(with: configData) as? [String: Any] else {
            reject("INVALID_CONFIG", "Invalid VPN configuration format", nil)
            return
        }

        // Parse WireGuard configuration
        guard let serverEndpoint = configDict["serverEndpoint"] as? String,
              let publicKey = configDict["publicKey"] as? String,
              let privateKey = configDict["privateKey"] as? String,
              let allowedIPs = configDict["allowedIPs"] as? [String],
              let dns = configDict["dns"] as? [String] else {
            reject("INVALID_CONFIG", "Missing required configuration parameters", nil)
            return
        }

        DispatchQueue.main.async { [weak self] in
            self?.startVPNConnection(
                serverEndpoint: serverEndpoint,
                publicKey: publicKey,
                privateKey: privateKey,
                allowedIPs: allowedIPs,
                dns: dns,
                selectedApps: selectedApps,
                resolve: resolve,
                reject: reject
            )
        }
    }

    @objc(stopVPN:rejecter:)
    func stopVPN(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {

        DispatchQueue.main.async { [weak self] in
            guard let manager = self?.tunnelProviderManager else {
                reject("NO_VPN_MANAGER", "VPN manager not initialized", nil)
                return
            }

            manager.connection.stopVPNTunnel()
            resolve(true)
        }
    }

    @objc(getVPNStatus:rejecter:)
    func getVPNStatus(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {

        DispatchQueue.main.async { [weak self] in
            guard let manager = self?.tunnelProviderManager else {
                resolve(KuzaVpnModule.STATUS_DISCONNECTED)
                return
            }

            let status = self?.convertVPNStatus(manager.connection.status) ?? KuzaVpnModule.STATUS_DISCONNECTED
            resolve(status)
        }
    }

    // MARK: - App Management Methods

    @objc(getInstalledApps:rejecter:)
    func getInstalledApps(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {

        // iOS doesn't allow enumeration of installed apps due to privacy restrictions
        // Return predefined list of popular apps
        let popularApps = getPopularAppsList()
        resolve(popularApps)
    }

    @objc(getPopularApps:rejecter:)
    func getPopularApps(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {

        let popularApps = getPopularAppsList()
        resolve(popularApps)
    }

    @objc(isAppInstalled:resolver:rejecter:)
    func isAppInstalled(packageName: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {

        // iOS doesn't allow checking if specific apps are installed due to privacy restrictions
        // Return true for apps in our predefined list
        let popularApps = getPopularAppsList()
        let isInstalled = popularApps.contains { app in
            guard let appPackageName = app["packageName"] as? String else { return false }
            return appPackageName == packageName
        }

        resolve(isInstalled)
    }

    // MARK: - Statistics Methods

    @objc(getBandwidthStats:rejecter:)
    func getBandwidthStats(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {

        // iOS doesn't provide easy access to VPN bandwidth statistics
        // Return mock data for now
        let stats: [String: Any] = [
            "bytesReceived": Int.random(in: 0...1000000),
            "bytesSent": Int.random(in: 0...500000),
            "totalBytes": Int.random(in: 500000...1500000),
            "lastUpdated": ISO8601DateFormatter().string(from: Date())
        ]

        resolve(stats)
    }

    // MARK: - Private Helper Methods

    private func setupVPNStatusObserver() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(vpnStatusDidChange),
            name: .NEVPNStatusDidChange,
            object: nil
        )
    }

    @objc private func vpnStatusDidChange(notification: Notification) {
        guard let connection = notification.object as? NEVPNConnection else { return }

        let status = convertVPNStatus(connection.status)
        currentStatus = connection.status

        // Send status update to React Native
        sendEvent(withName: "VPNStatusChanged", body: ["status": status])
    }

    private func convertVPNStatus(_ status: NEVPNStatus) -> String {
        switch status {
        case .connected:
            return KuzaVpnModule.STATUS_CONNECTED
        case .connecting, .reasserting:
            return KuzaVpnModule.STATUS_CONNECTING
        case .disconnected, .disconnecting, .invalid:
            return KuzaVpnModule.STATUS_DISCONNECTED
        @unknown default:
            return KuzaVpnModule.STATUS_DISCONNECTED
        }
    }

    private func createTunnelProviderManager(completion: @escaping (Bool) -> Void) {
        let manager = NETunnelProviderManager()
        manager.localizedDescription = "KuzaVPN"

        let protocolConfig = NETunnelProviderProtocol()
        protocolConfig.providerBundleIdentifier = "com.kuzavpn.tunnelprovider"
        protocolConfig.serverAddress = "KuzaVPN Server"

        manager.protocolConfiguration = protocolConfig
        manager.isEnabled = true

        manager.saveToPreferences { [weak self] error in
            if let error = error {
                print("Failed to save VPN configuration: \(error)")
                completion(false)
            } else {
                self?.tunnelProviderManager = manager
                completion(true)
            }
        }
    }

    private func startVPNConnection(
        serverEndpoint: String,
        publicKey: String,
        privateKey: String,
        allowedIPs: [String],
        dns: [String],
        selectedApps: [String],
        resolve: @escaping RCTPromiseResolveBlock,
        reject: @escaping RCTPromiseRejectBlock
    ) {

        guard let manager = tunnelProviderManager else {
            reject("NO_VPN_MANAGER", "VPN manager not initialized", nil)
            return
        }

        // Convert selected apps to domain rules using our mapper
        let domainRules = appDomainMapper.convertAppsToDomainRules(selectedApps)

        // Create WireGuard configuration string
        let wireguardConfigString = createWireGuardConfigString(
            privateKey: privateKey,
            publicKey: publicKey,
            serverEndpoint: serverEndpoint,
            allowedIPs: allowedIPs,
            dns: dns
        )

        // Create provider configuration
        let providerConfiguration: [String: Any] = [
            "wireguardConfig": wireguardConfigString,
            "selectedApps": selectedApps,
            "domainRules": domainRules
        ]

        // Update protocol configuration
        if let protocolConfig = manager.protocolConfiguration as? NETunnelProviderProtocol {
            protocolConfig.providerConfiguration = providerConfiguration

            manager.saveToPreferences { [weak self] error in
                if let error = error {
                    reject("VPN_SAVE_ERROR", "Failed to save VPN configuration: \(error.localizedDescription)", error)
                    return
                }

                // Start the VPN
                do {
                    try manager.connection.startVPNTunnel()
                    resolve(true)
                } catch {
                    reject("VPN_START_ERROR", "Failed to start VPN: \(error.localizedDescription)", error)
                }
            }
        } else {
            reject("INVALID_PROTOCOL", "Invalid VPN protocol configuration", nil)
        }
    }

    private func createWireGuardConfigString(
        privateKey: String,
        publicKey: String,
        serverEndpoint: String,
        allowedIPs: [String],
        dns: [String]
    ) -> String {
        let allowedIPsString = allowedIPs.joined(separator: ", ")
        let dnsString = dns.joined(separator: ", ")

        return """
        [Interface]
        PrivateKey = \(privateKey)
        Address = 10.0.0.2/24
        DNS = \(dnsString)

        [Peer]
        PublicKey = \(publicKey)
        Endpoint = \(serverEndpoint)
        AllowedIPs = \(allowedIPsString)
        PersistentKeepalive = 25
        """
    }

    private func getPopularAppsList() -> [[String: Any]] {
        return [
            [
                "packageName": "com.snapchat.Snapchat",
                "appName": "Snapchat",
                "isSystemApp": false
            ],
            [
                "packageName": "net.whatsapp.WhatsApp",
                "appName": "WhatsApp",
                "isSystemApp": false
            ],
            [
                "packageName": "com.burbn.instagram",
                "appName": "Instagram",
                "isSystemApp": false
            ],
            [
                "packageName": "com.zhiliaoapp.musically",
                "appName": "TikTok",
                "isSystemApp": false
            ],
            [
                "packageName": "com.twitter.app",
                "appName": "Twitter",
                "isSystemApp": false
            ],
            [
                "packageName": "com.spotify.client",
                "appName": "Spotify",
                "isSystemApp": false
            ],
            [
                "packageName": "com.google.ios.youtube",
                "appName": "YouTube",
                "isSystemApp": false
            ],
            [
                "packageName": "com.netflix.Netflix",
                "appName": "Netflix",
                "isSystemApp": false
            ]
        ]
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
    }
}
