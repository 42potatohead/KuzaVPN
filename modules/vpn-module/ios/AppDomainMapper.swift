import Foundation
import Network

/**
 * Maps iOS app bundle IDs to their associated domains and IP ranges
 * Used for domain-based VPN routing since iOS doesn't support true per-app VPN
 */
class AppDomainMapper {

    // Static mapping of popular apps to their domains
    private let appDomainMapping: [String: [String]] = [
        // Social Media
        "com.burbn.instagram": [
            "instagram.com", "cdninstagram.com", "facebook.com",
            "instagramstatic-a.akamaihd.net", "scontent.cdninstagram.com"
        ],
        "com.snapchat.Snapchat": [
            "snapchat.com", "sc-cdn.net", "snap-dev.net",
            "snapkit.com", "snap.com"
        ],
        "com.zhiliaoapp.musically": [ // TikTok
            "tiktok.com", "muscdn.com", "musical.ly",
            "byteoversea.com", "tiktokcdn.com"
        ],
        "com.twitter.app": [
            "twitter.com", "twimg.com", "t.co",
            "twitterstatus.com", "twitter.map.fastly.net"
        ],
        "com.facebook.Facebook": [
            "facebook.com", "fbcdn.net", "fb.com",
            "facebook.net", "fbsbx.com"
        ],

        // Messaging
        "net.whatsapp.WhatsApp": [
            "whatsapp.com", "whatsapp.net", "wa.me",
            "whatsapp-plus.info"
        ],
        "com.discord": [
            "discord.com", "discordapp.com", "discord.gg",
            "discord.media", "discord.co"
        ],
        "ph.telegra.Telegraph": [
            "telegram.org", "t.me", "telegra.ph",
            "telegram.me"
        ],

        // Entertainment
        "com.spotify.client": [
            "spotify.com", "scdn.co", "spotifycdn.com",
            "spotify.map.fastly.net"
        ],
        "com.netflix.Netflix": [
            "netflix.com", "nflxso.net", "nflxext.com",
            "nflximg.net", "nflxvideo.net"
        ],
        "com.google.ios.youtube": [
            "youtube.com", "youtubei.googleapis.com", "ytimg.com",
            "googlevideo.com", "youtube-nocookie.com"
        ],

        // Gaming
        "com.epicgames.FortniteGame": [
            "epicgames.com", "fortnite.com", "unrealengine.com",
            "battlebreakers.com"
        ],
        "com.riotgames.leagueoflegends": [
            "riotgames.com", "leagueoflegends.com", "riot.net",
            "riotcdn.net"
        ]
    ]

    // DNS resolver for domain to IP mapping
    private var dnsResolver: DNSResolver

    init() {
        self.dnsResolver = DNSResolver()
    }

    /**
     * Get domains associated with an app bundle ID
     */
    func getDomains(for bundleId: String) -> [String] {
        return appDomainMapping[bundleId] ?? []
    }

    /**
     * Get IP ranges for a list of domains
     */
    func getIPRanges(for domains: [String]) -> [IPRange] {
        var ipRanges: [IPRange] = []

        for domain in domains {
            let ips = dnsResolver.resolveIPs(for: domain)
            for ip in ips {
                // Create /32 subnet for each IP (exact IP match)
                let ipRange = IPRange(address: ip, mask: "255.255.255.255")
                ipRanges.append(ipRange)
            }
        }

        return ipRanges
    }

    /**
     * Get popular social media domains for default routing
     */
    func getPopularSocialMediaDomains() -> [String] {
        return [
            // Core social platforms
            "facebook.com", "instagram.com", "twitter.com",
            "snapchat.com", "tiktok.com", "youtube.com",

            // CDNs and media servers
            "fbcdn.net", "cdninstagram.com", "twimg.com",
            "ytimg.com", "googlevideo.com", "scdn.co",

            // Messaging platforms
            "whatsapp.com", "discord.com", "telegram.org"
        ]
    }

    /**
     * Check if a domain belongs to a selected app
     */
    func isAppDomain(_ domain: String, for bundleIds: [String]) -> Bool {
        for bundleId in bundleIds {
            let domains = getDomains(for: bundleId)
            if domains.contains(where: { appDomain in
                domain.hasSuffix(appDomain) || appDomain.hasSuffix(domain)
            }) {
                return true
            }
        }
        return false
    }

    /**
     * Get app name from bundle ID (for debugging/logging)
     */
    func getAppName(for bundleId: String) -> String {
        let appNames: [String: String] = [
            "com.burbn.instagram": "Instagram",
            "com.snapchat.Snapchat": "Snapchat",
            "com.zhiliaoapp.musically": "TikTok",
            "com.twitter.app": "Twitter",
            "com.facebook.Facebook": "Facebook",
            "net.whatsapp.WhatsApp": "WhatsApp",
            "com.discord": "Discord",
            "com.spotify.client": "Spotify",
            "com.netflix.Netflix": "Netflix",
            "com.google.ios.youtube": "YouTube"
        ]

        return appNames[bundleId] ?? bundleId
    }
}

/**
 * Represents an IP address range for routing
 */
struct IPRange {
    let address: String
    let mask: String
}

/**
 * DNS resolver for converting domains to IP addresses
 */
class DNSResolver {

    /**
     * Resolve IP addresses for a given domain
     * Returns cached results for performance
     */
    func resolveIPs(for domain: String) -> [String] {
        // For now, return some common IPs for major services
        // In production, implement actual DNS resolution

        let commonIPs: [String: [String]] = [
            "facebook.com": ["157.240.0.0", "31.13.64.0"],
            "instagram.com": ["157.240.0.0", "31.13.64.0"],
            "snapchat.com": ["35.186.224.0", "35.241.0.0"],
            "tiktok.com": ["104.244.42.0", "104.244.43.0"],
            "twitter.com": ["104.244.42.0", "199.16.156.0"],
            "youtube.com": ["216.58.194.0", "172.217.0.0"],
            "whatsapp.com": ["157.240.0.0", "31.13.64.0"],
            "discord.com": ["162.159.128.0", "162.159.129.0"],
            "spotify.com": ["35.186.224.0", "104.154.0.0"],
            "netflix.com": ["23.246.0.0", "37.77.184.0"]
        ]

        // Find matching domain
        for (key, ips) in commonIPs {
            if domain.hasSuffix(key) {
                return ips
            }
        }

        // Default fallback - attempt actual DNS resolution
        return resolveIPsViaNSLookup(domain: domain)
    }

    /**
     * Attempt actual DNS resolution using NSLookup
     * This is a simplified implementation
     */
    private func resolveIPsViaNSLookup(domain: String) -> [String] {
        // TODO: Implement actual DNS resolution using Network framework
        // For now, return empty array for unknown domains
        return []
    }
}
