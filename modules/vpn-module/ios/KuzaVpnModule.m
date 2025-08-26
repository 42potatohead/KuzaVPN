//
//  KuzaVpnModule.m
//  KuzaVPN Native Module for React Native
//
//  Created by KuzaVPN Team
//  Copyright © 2024 KuzaVPN. All rights reserved.
//

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(KuzaVpnModule, RCTEventEmitter)

// VPN Control Methods
RCT_EXTERN_METHOD(requestVPNPermission:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(startVPN:(NSString *)config
                  selectedApps:(NSArray<NSString *> *)selectedApps
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(stopVPN:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getVPNStatus:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// App Management Methods
RCT_EXTERN_METHOD(getInstalledApps:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getPopularApps:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(isAppInstalled:(NSString *)packageName
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Statistics Methods
RCT_EXTERN_METHOD(getBandwidthStats:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Constants
+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

// Supported events for React Native
- (NSArray<NSString *> *)supportedEvents
{
  return @[@"VPNStatusChanged", @"BandwidthUpdated", @"VPNError"];
}

@end
