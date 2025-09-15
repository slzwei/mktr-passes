# Google Wallet Plan - Milestone 3

## Overview

This document outlines the plan for implementing Google Wallet support in Milestone 3. Google Wallet uses a different format and API than Apple Wallet, requiring a separate implementation.

## Google Wallet Architecture

### Pass Types

Google Wallet supports several pass types:

1. **Loyalty Program** - Similar to Apple's generic pass
2. **Offer** - Coupons and discounts
3. **Gift Card** - Prepaid cards
4. **Transit** - Public transportation
5. **Event Ticket** - Event passes
6. **Flight** - Airline tickets
7. **Transit** - Public transportation

### Key Differences from Apple Wallet

| Feature | Apple Wallet | Google Wallet |
|---------|-------------|---------------|
| Format | .pkpass (ZIP) | JWT + REST API |
| Signing | PKCS#7 | JWT with RS256 |
| Updates | Push notifications | REST API calls |
| Images | PNG files | Base64 encoded |
| Fields | JSON structure | JWT payload |

## Implementation Plan

### 1. Core Infrastructure

#### JWT Library
```typescript
// packages/google-wallet/src/jwt.ts
export class GoogleWalletJWT {
  private issuerId: string;
  private privateKey: string;
  
  createSaveUrl(classId: string, objectId: string): string;
  createPass(classId: string, objectId: string, data: any): string;
  verifyToken(token: string): boolean;
}
```

#### REST API Client
```typescript
// packages/google-wallet/src/api.ts
export class GoogleWalletAPI {
  private baseUrl: string;
  private accessToken: string;
  
  createClass(classData: ClassData): Promise<Class>;
  updateClass(classId: string, classData: ClassData): Promise<Class>;
  getClass(classId: string): Promise<Class>;
  deleteClass(classId: string): Promise<void>;
  
  createObject(objectData: ObjectData): Promise<Object>;
  updateObject(objectId: string, objectData: ObjectData): Promise<Object>;
  getObject(objectId: string): Promise<Object>;
  deleteObject(objectId: string): Promise<void>;
}
```

### 2. Pass Types

#### Loyalty Program
```typescript
interface LoyaltyClass {
  id: string;
  issuerName: string;
  programName: string;
  programLogo: Image;
  hexBackgroundColor: string;
  hexTextColor: string;
}

interface LoyaltyObject {
  id: string;
  classId: string;
  state: 'ACTIVE' | 'EXPIRED' | 'INACTIVE';
  loyaltyPoints: {
    label: string;
    balance: {
      string: string;
    };
  };
  accountName: string;
  accountId: string;
  barcode: Barcode;
}
```

#### Offer
```typescript
interface OfferClass {
  id: string;
  issuerName: string;
  title: string;
  titleImage: Image;
  hexBackgroundColor: string;
  hexTextColor: string;
}

interface OfferObject {
  id: string;
  classId: string;
  state: 'ACTIVE' | 'EXPIRED' | 'INACTIVE';
  title: string;
  offerType: 'OFFER_TYPE_UNSPECIFIED' | 'OFFER_TYPE_DISCOUNT' | 'OFFER_TYPE_FREEBEES';
  validTimeInterval: TimeInterval;
  barcode: Barcode;
}
```

#### Gift Card
```typescript
interface GiftCardClass {
  id: string;
  issuerName: string;
  reviewStatus: 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  hexBackgroundColor: string;
  hexTextColor: string;
}

interface GiftCardObject {
  id: string;
  classId: string;
  state: 'ACTIVE' | 'EXPIRED' | 'INACTIVE';
  cardNumber: string;
  pin: string;
  balance: Money;
  balanceUpdateTime: string;
  barcode: Barcode;
}
```

### 3. Template System

#### Google Wallet Templates
```typescript
// packages/core/src/google-templates.ts
export interface GoogleTemplate {
  id: string;
  name: string;
  type: 'loyalty' | 'offer' | 'gift_card';
  classFields: Record<string, any>;
  objectFields: Record<string, any>;
  requiredImages: string[];
  variables: Record<string, VariableDefinition>;
}

export const GOOGLE_TEMPLATES: GoogleTemplate[] = [
  {
    id: 'loyalty_stamp_card_v1',
    name: 'Loyalty Stamp Card',
    type: 'loyalty',
    classFields: {
      issuerName: { type: 'string', required: true },
      programName: { type: 'string', required: true },
      programLogo: { type: 'image', required: true },
      hexBackgroundColor: { type: 'color', required: true },
      hexTextColor: { type: 'color', required: true }
    },
    objectFields: {
      accountName: { type: 'string', required: true },
      accountId: { type: 'string', required: true },
      loyaltyPoints: { type: 'object', required: true },
      barcode: { type: 'object', required: true }
    },
    requiredImages: ['programLogo'],
    variables: {
      brandName: { type: 'string', required: true },
      memberName: { type: 'string', required: true },
      stampCount: { type: 'number', required: true },
      stampTarget: { type: 'number', required: true },
      rewardText: { type: 'string', required: true }
    }
  }
  // ... more templates
];
```

### 4. API Integration

#### Google Wallet Service
```typescript
// apps/api/src/services/google-wallet.service.ts
export class GoogleWalletService {
  private jwt: GoogleWalletJWT;
  private api: GoogleWalletAPI;
  
  async createPass(templateId: string, data: PassData): Promise<{ classId: string; objectId: string; saveUrl: string }> {
    // 1. Get template
    const template = getGoogleTemplate(templateId);
    
    // 2. Create class
    const classData = this.buildClassData(template, data);
    const classId = await this.api.createClass(classData);
    
    // 3. Create object
    const objectData = this.buildObjectData(template, data);
    const objectId = await this.api.createObject(objectData);
    
    // 4. Generate save URL
    const saveUrl = this.jwt.createSaveUrl(classId, objectId);
    
    return { classId, objectId, saveUrl };
  }
  
  async updatePass(objectId: string, data: PassData): Promise<void> {
    const objectData = this.buildObjectData(template, data);
    await this.api.updateObject(objectId, objectData);
  }
  
  async deletePass(objectId: string): Promise<void> {
    await this.api.deleteObject(objectId);
  }
}
```

### 5. Database Schema

#### Google Wallet Tables
```sql
-- Google Wallet classes
CREATE TABLE google_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id VARCHAR NOT NULL,
  class_id VARCHAR NOT NULL UNIQUE,
  class_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Google Wallet objects
CREATE TABLE google_objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES google_classes(id),
  object_id VARCHAR NOT NULL UNIQUE,
  object_data JSONB NOT NULL,
  state VARCHAR NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Google Wallet passes (links Apple and Google passes)
CREATE TABLE wallet_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apple_pass_id UUID REFERENCES passes(id),
  google_class_id UUID REFERENCES google_classes(id),
  google_object_id UUID REFERENCES google_objects(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 6. Web Editor Updates

#### Google Wallet Editor
```typescript
// apps/web/src/pages/GoogleEditor.tsx
export function GoogleEditor() {
  const [template, setTemplate] = useState<GoogleTemplate | null>(null);
  const [passData, setPassData] = useState<PassData>({});
  const [saveUrl, setSaveUrl] = useState<string | null>(null);
  
  const handleCreatePass = async () => {
    const result = await apiService.createGooglePass(templateId, passData);
    setSaveUrl(result.saveUrl);
  };
  
  return (
    <div className="google-editor">
      <div className="controls">
        {/* Template-specific controls */}
      </div>
      <div className="preview">
        {/* Google Wallet preview */}
      </div>
      <div className="actions">
        <button onClick={handleCreatePass}>
          Create Google Wallet Pass
        </button>
        {saveUrl && (
          <a href={saveUrl} target="_blank">
            Add to Google Wallet
          </a>
        )}
      </div>
    </div>
  );
}
```

### 7. API Endpoints

#### Google Wallet Endpoints
```typescript
// apps/api/src/routes/google-wallet.ts
export async function googleWalletRoutes(fastify: FastifyInstance) {
  // Create Google Wallet pass
  fastify.post('/api/google-wallet/passes', async (request, reply) => {
    const { templateId, data } = request.body;
    const result = await googleWalletService.createPass(templateId, data);
    return result;
  });
  
  // Update Google Wallet pass
  fastify.put('/api/google-wallet/passes/:objectId', async (request, reply) => {
    const { objectId } = request.params;
    const { data } = request.body;
    await googleWalletService.updatePass(objectId, data);
    return { success: true };
  });
  
  // Delete Google Wallet pass
  fastify.delete('/api/google-wallet/passes/:objectId', async (request, reply) => {
    const { objectId } = request.params;
    await googleWalletService.deletePass(objectId);
    return { success: true };
  });
  
  // Get Google Wallet pass
  fastify.get('/api/google-wallet/passes/:objectId', async (request, reply) => {
    const { objectId } = request.params;
    const pass = await googleWalletService.getPass(objectId);
    return pass;
  });
}
```

### 8. Configuration

#### Google Wallet Settings
```typescript
// apps/api/src/config.ts
export const config = {
  // ... existing config
  
  // Google Wallet
  googleWallet: {
    issuerId: process.env.GOOGLE_WALLET_ISSUER_ID || '',
    privateKey: process.env.GOOGLE_WALLET_PRIVATE_KEY || '',
    serviceAccountEmail: process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL || '',
    baseUrl: 'https://walletobjects.googleapis.com/walletobjects/v1',
  }
};
```

#### Environment Variables
```bash
# Google Wallet
GOOGLE_WALLET_ISSUER_ID=your-issuer-id
GOOGLE_WALLET_PRIVATE_KEY=your-private-key
GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
```

### 9. Testing

#### Google Wallet Tests
```typescript
// packages/google-wallet/src/__tests__/jwt.test.ts
describe('GoogleWalletJWT', () => {
  it('should create valid save URL', () => {
    const jwt = new GoogleWalletJWT(issuerId, privateKey);
    const saveUrl = jwt.createSaveUrl(classId, objectId);
    expect(saveUrl).toMatch(/^https:\/\/pay\.google\.com\/gp\/p\/\?.*$/);
  });
  
  it('should create valid pass JWT', () => {
    const jwt = new GoogleWalletJWT(issuerId, privateKey);
    const passJWT = jwt.createPass(classId, objectId, passData);
    expect(passJWT).toBeDefined();
  });
});
```

### 10. Migration Strategy

#### Phase 1: Core Infrastructure
- [ ] JWT library implementation
- [ ] REST API client
- [ ] Basic pass types
- [ ] Database schema

#### Phase 2: Template System
- [ ] Google Wallet templates
- [ ] Template conversion
- [ ] Variable mapping
- [ ] Image handling

#### Phase 3: API Integration
- [ ] Google Wallet service
- [ ] API endpoints
- [ ] Error handling
- [ ] Rate limiting

#### Phase 4: Web Editor
- [ ] Google Wallet editor
- [ ] Template selection
- [ ] Pass preview
- [ ] Save URL generation

#### Phase 5: Testing & Deployment
- [ ] Unit tests
- [ ] Integration tests
- [ ] End-to-end tests
- [ ] Production deployment

## Key Considerations

### 1. Authentication
- Google Wallet requires OAuth 2.0
- Service account authentication
- JWT signing with RS256
- Token refresh handling

### 2. Rate Limits
- Google Wallet has strict rate limits
- Implement exponential backoff
- Cache responses when possible
- Monitor usage

### 3. Pass Updates
- Google Wallet uses REST API for updates
- No push notifications
- Polling required for updates
- Batch updates supported

### 4. Image Handling
- Images must be base64 encoded
- Size limits apply
- CDN recommended
- Format restrictions

### 5. Error Handling
- Google Wallet has specific error codes
- Retry logic required
- User-friendly error messages
- Logging and monitoring

## Future Enhancements

### 1. Advanced Features
- Pass analytics
- A/B testing
- Personalization
- Dynamic content

### 2. Integration
- CRM integration
- Marketing automation
- Analytics platforms
- Third-party services

### 3. Performance
- Caching strategies
- CDN integration
- Database optimization
- API optimization

### 4. Security
- Enhanced authentication
- Audit logging
- Compliance features
- Security monitoring

## Conclusion

The Google Wallet implementation will provide a complete pass creation platform supporting both Apple Wallet and Google Wallet. The modular architecture allows for easy extension and maintenance while providing a consistent user experience across platforms.
