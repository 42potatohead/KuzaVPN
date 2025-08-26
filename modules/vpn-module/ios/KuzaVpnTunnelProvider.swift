import NetworkExtension
import WireGuardKit
import os.log

/**
 * KuzaVPN Packet Tunnel Provider for iOS
 * Implements WireGuard VPN with domain-based app routing
 */
class KuzaVpnTunnelProvider: NEPacketTunnelProvider {

    private static let logger = Logger(subsystem: "com.kuzavpn", category: "PacketTunnel")

    private var wireguardAdapter: WireGuardAdapter?
    private var selectedApps: [String] = []
    private var appDomainMapper: AppDomainMapper?

    override func startTunnel(options: [String : NSObject]?, completionHandler: @escaping (Error?) -> Void) {
        logger.info("Starting KuzaVPN tunnel")

        // Parse configuration from options
        guard let configData = parseConfiguration(options: options) else {
            completionHandler(NEVPNError(.configurationInvalid))
            return
        }

        selectedApps = configData.selectedApps
        appDomainMapper = AppDomainMapper()

        // Create WireGuard tunnel configuration
        let tunnelConfiguration: TunnelConfiguration
        do {
            tunnelConfiguration = try TunnelConfiguration(fromWgQuickConfig: configData.wireguardConfig)
        } catch {
            logger.error("Failed to parse WireGuard configuration: \(error.localizedDescription)")
            completionHandler(error)
            return
        }

        // Configure network settings with app-based routing
        let networkSettings = createNetworkSettings(
            from: tunnelConfiguration,
            selectedApps: selectedApps
        )

        // Set tunnel network settings
        setTunnelNetworkSettings(networkSettings) { [weak self] error in
            if let error = error {
                self?.logger.error("Failed to set tunnel network settings: \(error.localizedDescription)")
                completionHandler(error)
                return
            }

            // Start WireGuard adapter
            self?.startWireGuardAdapter(tunnelConfiguration: tunnelConfiguration, completionHandler: completionHandler)
        }
    }

    override func stopTunnel(with reason: NEProviderStopReason, completionHandler: @escaping () -> Void) {
        logger.info("Stopping KuzaVPN tunnel, reason: \(reason)")

        wireguardAdapter?.stop { error in
            if let error = error {
                self.logger.error("Failed to stop WireGuard adapter: \(error.localizedDescription)")
            }

            self.wireguardAdapter = nil
            completionHandler()
        }
    }

    override func handleAppMessage(_ messageData: Data, completionHandler: ((Data?) -> Void)?) {
        // Handle messages from the main app
        logger.info("Received app message")

        guard let message = try? JSONSerialization.jsonObject(with: messageData) as? [String: Any] else {
            completionHandler?(nil)
            return
        }

        if let action = message["action"] as? String {
            switch action {
            case "getStatus":
                let status = ["isConnected": wireguardAdapter != nil]
                let responseData = try? JSONSerialization.data(withJSONObject: status)
                completionHandler?(responseData)

            case "updateSelectedApps":
                if let apps = message["apps"] as? [String] {
                    selectedApps = apps
                    logger.info("Updated selected apps: \(apps.count) apps")
                }
                completionHandler?(nil)

            default:
                completionHandler?(nil)
            }
        }
    }

    // MARK: - Private Methods

    private func parseConfiguration(options: [String : NSObject]?) -> (wireguardConfig: String, selectedApps: [String])? {
        guard let options = options,
              let configString = options["wireguardConfig"] as? String,
              let appsArray = options["selectedApps"] as? [String] else {
            logger.error("Invalid configuration options")
            return nil
        }

        return (wireguardConfig: configString, selectedApps: appsArray)
    }

    private func createNetworkSettings(from configuration: TunnelConfiguration, selectedApps: [String]) -> NEPacketTunnelNetworkSettings {
        let networkSettings = NEPacketTunnelNetworkSettings(tunnelRemoteAddress: "127.0.0.1")

        // Configure IPv4 settings
        let ipv4Settings = NEIPv4Settings(addresses: ["10.0.0.2"], subnetMasks: ["255.255.255.255"])

        // Configure DNS
        let dnsSettings = NEDNSSettings(servers: ["1.1.1.1", "8.8.8.8"])
        dnsSettings.matchDomains = [""]

        // Configure routes based on selected apps
        if selectedApps.isEmpty {
            // Route all traffic through VPN
            ipv4Settings.includedRoutes = [NEIPv4Route.default()]
        } else {
            // Route only selected app domains through VPN
            let appRoutes = createAppBasedRoutes(selectedApps: selectedApps)
            ipv4Settings.includedRoutes = appRoutes.included
            ipv4Settings.excludedRoutes = appRoutes.excluded
        }

        networkSettings.ipv4Settings = ipv4Settings
        networkSettings.dnsSettings = dnsSettings
        networkSettings.mtu = 1420

        return networkSettings
    }

    private func createAppBasedRoutes(selectedApps: [String]) -> (included: [NEIPv4Route], excluded: [NEIPv4Route]) {
        guard let appDomainMapper = appDomainMapper else {
            return (included: [], excluded: [NEIPv4Route.default()])
        }

        var includedRoutes: [NEIPv4Route] = []
        var excludedRoutes: [NEIPv4Route] = []

        // Get domains/IPs for selected apps
        for appBundleId in selectedApps {
            let domains = appDomainMapper.getDomains(for: appBundleId)
            let ips = appDomainMapper.getIPRanges(for: domains)

            for ipRange in ips {
                let route = NEIPv4Route(destinationAddress: ipRange.address, subnetMask: ipRange.mask)
                includedRoutes.append(route)
            }
        }

        // If no specific routes found, route popular social media domains
        if includedRoutes.isEmpty {
            let popularDomains = appDomainMapper.getPopularSocialMediaDomains()
            let ips = appDomainMapper.getIPRanges(for: popularDomains)

            for ipRange in ips {
                let route = NEIPv4Route(destinationAddress: ipRange.address, subnetMask: ipRange.mask)
                includedRoutes.append(route)
            }
        }

        return (included: includedRoutes, excluded: excludedRoutes)
    }

    private func startWireGuardAdapter(tunnelConfiguration: TunnelConfiguration, completionHandler: @escaping (Error?) -> Void) {
        let adapter = WireGuardAdapter(with: self) { logLevel, message in
            self.logger.log(level: logLevel.osLogLevel, "\(message)")
        }

        adapter.start(tunnelConfiguration: tunnelConfiguration) { error in
            if let error = error {
                self.logger.error("Failed to start WireGuard adapter: \(error.localizedDescription)")
            } else {
                self.logger.info("WireGuard adapter started successfully")
                self.wireguardAdapter = adapter
            }

            completionHandler(error)
        }
    }
}

// MARK: - Extensions

extension WireGuardLogLevel {
    var osLogLevel: OSLogType {
        switch self {
        case .verbose:
            return .debug
        case .error:
            return .error
        }
    }
}

/**
 * Configuration data structure
 */
struct VPNConfigurationData {
    let wireguardConfig: String
    let selectedApps: [String]
}
