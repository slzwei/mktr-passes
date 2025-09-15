import * as forge from 'node-forge';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface SigningOptions {
  passTypeIdCert: Buffer;
  passTypeIdPassword: string;
  wwdrCert: Buffer;
}

/**
 * Creates a PKCS#7 detached signature using OpenSSL
 */
export async function createDetachedSignature(
  data: Buffer,
  options: SigningOptions
): Promise<Buffer> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pkpass-'));
  
  try {
    // Write certificates and data to temp files
    const passCertPath = path.join(tempDir, 'pass.p12');
    const wwdrCertPath = path.join(tempDir, 'wwdr.pem');
    const dataPath = path.join(tempDir, 'data');
    const signaturePath = path.join(tempDir, 'signature');

    await fs.writeFile(passCertPath, options.passTypeIdCert);
    await fs.writeFile(wwdrCertPath, options.wwdrCert);
    await fs.writeFile(dataPath, data);

    // Create PKCS#7 detached signature using OpenSSL
    const opensslArgs = [
      'cms',
      '-sign',
      '-detach',
      '-binary',
      '-in', dataPath,
      '-out', signaturePath,
      '-signer', passCertPath,
      '-inkey', passCertPath,
      '-passin', `pass:${options.passTypeIdPassword}`,
      '-certfile', wwdrCertPath,
      '-outform', 'DER'
    ];

    await new Promise<void>((resolve, reject) => {
      const openssl = spawn('openssl', opensslArgs, { stdio: 'pipe' });
      
      let stderr = '';
      openssl.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      openssl.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`OpenSSL failed with code ${code}: ${stderr}`));
        }
      });

      openssl.on('error', (error) => {
        reject(new Error(`Failed to spawn OpenSSL: ${error.message}`));
      });
    });

    // Read the signature
    const signature = await fs.readFile(signaturePath);
    return signature;
  } finally {
    // Clean up temp files
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

/**
 * Creates a PKCS#7 detached signature using node-forge (fallback)
 */
export function createDetachedSignatureForge(
  data: Buffer,
  options: SigningOptions
): Buffer {
  try {
    // Parse P12 certificate
    const p12Asn1 = forge.asn1.fromDer(options.passTypeIdCert.toString('binary'));
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, options.passTypeIdPassword);
    
    // Get the signing certificate and key
    const bags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
    
    const certBags = bags[forge.pki.oids.certBag];
    const keyBagsArray = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag];
    
    if (!certBags || certBags.length === 0) {
      throw new Error('No certificate found in P12');
    }
    
    if (!keyBagsArray || keyBagsArray.length === 0) {
      throw new Error('No private key found in P12');
    }

    const cert = certBags[0] as any;
    const privateKey = keyBagsArray[0] as any;

    // Parse WWDR certificate
    const wwdrPem = options.wwdrCert.toString('utf8');
    const wwdrCert = forge.pki.certificateFromPem(wwdrPem);

    // Create PKCS#7 signed data
    const p7 = forge.pkcs7.createSignedData();
    p7.content = forge.util.createBuffer(data.toString('binary'));
    p7.addCertificate(cert);
    p7.addCertificate(wwdrCert);
    p7.addSigner({
      key: privateKey,
      certificate: cert,
      digestAlgorithm: forge.pki.oids.sha1,
      authenticatedAttributes: [{
        type: forge.pki.oids.contentTypes,
        value: forge.pki.oids.data
      }, {
        type: forge.pki.oids.messageDigest
      }, {
        type: forge.pki.oids.signingTime
      }]
    });

    p7.sign({ detached: true });
    
    // Convert to DER format
    const der = forge.asn1.toDer(p7.toAsn1()).getBytes();
    return Buffer.from(der, 'binary');
  } catch (error: any) {
    throw new Error(`Failed to create signature with node-forge: ${error.message}`);
  }
}
