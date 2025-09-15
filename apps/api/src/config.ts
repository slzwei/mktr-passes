import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/wallet',
  storageDir: process.env.STORAGE_DIR || './uploads',
  pkpassOutputDir: process.env.PKPASS_OUTPUT_DIR || './passes',
  
  // Apple Wallet certificates
  applePassCertP12: process.env.APPLE_PASS_CERT_P12 || './infra/certs/pass.p12',
  applePassCertPassword: process.env.APPLE_PASS_CERT_PASSWORD || 'changeme',
  appleWwdrCertPem: process.env.APPLE_WWDR_CERT_PEM || './infra/certs/AppleWWDRCAG3.pem',
  
  // Apple Wallet identifiers
  passTeamIdentifier: process.env.PASS_TEAM_IDENTIFIER || 'YOUR_TEAM_ID',
  passTypeIdentifier: process.env.PASS_TYPE_IDENTIFIER || 'pass.your.bundle.id',
  passOrgName: process.env.PASS_ORG_NAME || 'Your Organization Name',
  
  // Web Service auth
  passWebAuthScheme: process.env.PASS_WEB_AUTH_SCHEME || 'ApplePass',
  
  // APNs configuration
  apnsMode: process.env.APNS_MODE || 'mock',
  apnsTeamId: process.env.APNS_TEAM_ID || 'YOUR_TEAM_ID',
  apnsKeyId: process.env.APNS_KEY_ID || 'ABC123XYZ',
  apnsAuthKeyP8: process.env.APNS_AUTH_KEY_P8 || './infra/certs/AuthKey_ABC123XYZ.p8',
  apnsTopic: process.env.APNS_TOPIC || 'pass.your.bundle.id',
  apnsEnv: process.env.APNS_ENV || 'sandbox',
  apnsCertP12: process.env.APNS_CERT_P12 || './infra/certs/pass-push.p12',
  apnsCertPassword: process.env.APNS_CERT_PASSWORD || 'changeme',
};
