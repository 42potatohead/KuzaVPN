require "json"

package = JSON.parse(File.read(File.join(__dir__, "../../../package.json")))

Pod::Spec.new do |s|
  s.name         = "KuzaVpnModule"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.description  = <<-DESC
                  KuzaVPN native module for React Native with WireGuard support.
                  Provides VPN functionality with per-app routing on Android and domain-based routing on iOS.
                   DESC
  s.homepage     = "https://github.com/kuzavpn/react-native-kuza-vpn"
  s.license      = "MIT"
  s.platforms    = { :ios => "12.0" }
  s.source       = { :git => "https://github.com/kuzavpn/react-native-kuza-vpn.git", :tag => "#{s.version}" }

  s.source_files = "*.{h,m,mm,swift}"
  s.requires_arc = true

  # React Native dependencies
  s.dependency "React-Core"

  # WireGuard dependencies for iOS
  s.dependency "WireGuardKit", "~> 1.0"

  # Network Extensions framework
  s.frameworks = "NetworkExtension", "Security", "SystemConfiguration"

  # Swift version
  s.swift_version = "5.0"

  # iOS deployment target
  s.ios.deployment_target = "12.0"

  # Additional linker flags for WireGuard
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_OPTIMIZATION_LEVEL' => '-O',
    'APPLICATION_EXTENSION_API_ONLY' => 'YES'
  }

  # Exclude arm64 simulator architecture if needed
  s.pod_target_xcconfig = {
    'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'arm64'
  }
  s.user_target_xcconfig = { 'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'arm64' }
end
