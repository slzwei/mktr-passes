# QA Checklist

## Pre-Release Testing

### 1. Environment Setup

**Development Environment**:
- [ ] All packages installed (`pnpm install`)
- [ ] Database migrations run (`pnpm --filter db migrate`)
- [ ] Environment variables configured (`.env`)
- [ ] Certificates placed in `infra/certs/`
- [ ] All services start without errors

**Production Environment**:
- [ ] Production database configured
- [ ] Real Apple certificates installed
- [ ] Environment variables set
- [ ] SSL certificates configured
- [ ] Monitoring and logging enabled

### 2. API Testing

**Health Check**:
- [ ] `GET /health` returns 200 OK
- [ ] Response includes timestamp
- [ ] No errors in logs

**Templates**:
- [ ] `GET /api/templates` returns all 3 templates
- [ ] Template data includes all required fields
- [ ] `GET /api/templates/:id` returns specific template
- [ ] Invalid template ID returns 404

**Uploads**:
- [ ] `POST /api/uploads` accepts PNG files
- [ ] Returns correct asset information
- [ ] Rejects non-PNG files
- [ ] Handles large files appropriately
- [ ] SHA-256 deduplication works

**Passes**:
- [ ] `POST /api/passes/validate` validates correctly
- [ ] Returns errors for invalid data
- [ ] `POST /api/passes` creates pass successfully
- [ ] `GET /api/passes/:id/download` returns .pkpass file
- [ ] `GET /api/passes/:id` returns pass information

### 3. Web Application Testing

**Dashboard**:
- [ ] Loads all templates
- [ ] Template cards display correctly
- [ ] "Create Pass" buttons work
- [ ] Responsive design works on mobile

**Editor**:
- [ ] Loads template data
- [ ] Variable forms work correctly
- [ ] Color pickers function
- [ ] Image upload works
- [ ] Live preview updates
- [ ] Validation shows errors
- [ ] Pass generation works

**Navigation**:
- [ ] Links work correctly
- [ ] Back button works
- [ ] URL routing works
- [ ] Page refreshes work

### 4. Pass Generation Testing

**Template Tests**:
- [ ] Stamp Card template generates correctly
- [ ] Coupon template generates correctly
- [ ] Membership template generates correctly
- [ ] All required fields present
- [ ] Images included correctly
- [ ] Colors applied correctly
- [ ] Barcode generated correctly

**Validation Tests**:
- [ ] Missing required variables show errors
- [ ] Invalid image dimensions show errors
- [ ] Missing required images show errors
- [ ] Invalid barcode data shows errors
- [ ] All validation errors are clear

**File Tests**:
- [ ] .pkpass file is valid ZIP
- [ ] Contains all required files
- [ ] pass.json is valid JSON
- [ ] manifest.json has correct hashes
- [ ] signature is valid PKCS#7
- [ ] Images are correct format and size

### 5. CLI Testing

**Sample Generation**:
- [ ] `pnpm cli make-sample --template stamp_card_v1 --dev` works
- [ ] Generates valid .pkpass file
- [ ] Sample variables work correctly
- [ ] Development mode works

**Validation**:
- [ ] `pnpm cli validate --file pass.pkpass` works
- [ ] Valid pass returns success
- [ ] Invalid pass returns errors
- [ ] Error messages are clear

**Help**:
- [ ] `pnpm cli --help` shows help
- [ ] All commands documented
- [ ] Examples work correctly

### 6. Database Testing

**Schema**:
- [ ] All tables created correctly
- [ ] Foreign keys work
- [ ] Indexes created
- [ ] Constraints work

**Operations**:
- [ ] Pass creation works
- [ ] Asset storage works
- [ ] Pass retrieval works
- [ ] Pass deletion works
- [ ] Database migrations work

**Performance**:
- [ ] Queries execute quickly
- [ ] No slow queries
- [ ] Connection pooling works
- [ ] Database handles load

### 7. Security Testing

**Input Validation**:
- [ ] File uploads validated
- [ ] SQL injection prevented
- [ ] XSS prevented
- [ ] CSRF protection works

**Authentication**:
- [ ] No unauthorized access
- [ ] Rate limiting works
- [ ] Error messages don't leak info
- [ ] Logs don't contain secrets

**Certificates**:
- [ ] Certificates loaded correctly
- [ ] Signing works
- [ ] Invalid certificates rejected
- [ ] Certificate expiration handled

### 8. Performance Testing

**Load Testing**:
- [ ] API handles concurrent requests
- [ ] Database handles load
- [ ] File uploads work under load
- [ ] Pass generation works under load

**Memory Usage**:
- [ ] No memory leaks
- [ ] Garbage collection works
- [ ] Large files handled correctly
- [ ] Memory usage reasonable

**Response Times**:
- [ ] API responses < 1 second
- [ ] Pass generation < 10 seconds
- [ ] File uploads < 5 seconds
- [ ] Database queries < 100ms

### 9. Browser Testing

**Desktop Browsers**:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**Mobile Browsers**:
- [ ] Chrome Mobile
- [ ] Safari Mobile
- [ ] Firefox Mobile
- [ ] Samsung Internet

**Features**:
- [ ] File upload works
- [ ] Drag and drop works
- [ ] Color pickers work
- [ ] Responsive design works

### 10. Integration Testing

**End-to-End**:
- [ ] Complete pass creation flow
- [ ] File upload to pass generation
- [ ] Download and install pass
- [ ] Pass works in Apple Wallet

**API Integration**:
- [ ] Web app calls API correctly
- [ ] CLI calls API correctly
- [ ] Error handling works
- [ ] Data flow works

**Database Integration**:
- [ ] API writes to database
- [ ] Database reads work
- [ ] Transactions work
- [ ] Rollback works

## Apple Wallet Testing

### 1. Pass Installation

**Device Testing**:
- [ ] Pass installs on iPhone
- [ ] Pass installs on iPad
- [ ] Pass installs on Apple Watch
- [ ] Pass displays correctly

**Pass Features**:
- [ ] Fields display correctly
- [ ] Images display correctly
- [ ] Colors applied correctly
- [ ] Barcode scans correctly

**Pass Updates**:
- [ ] Pass updates work (if implemented)
- [ ] Push notifications work (if implemented)
- [ ] Pass removal works

### 2. Pass Validation

**Apple Validation**:
- [ ] Pass passes Apple validation
- [ ] No Apple warnings
- [ ] Pass works on all devices
- [ ] Pass updates work

**Third-party Validation**:
- [ ] Pass validates with tools
- [ ] No validation errors
- [ ] All fields correct
- [ ] Images correct

## Error Handling Testing

### 1. API Errors

**Client Errors**:
- [ ] 400 Bad Request
- [ ] 404 Not Found
- [ ] 413 Payload Too Large
- [ ] 422 Unprocessable Entity

**Server Errors**:
- [ ] 500 Internal Server Error
- [ ] Database connection errors
- [ ] File system errors
- [ ] Certificate errors

### 2. User Interface Errors

**Validation Errors**:
- [ ] Required field errors
- [ ] Invalid input errors
- [ ] File upload errors
- [ ] Image dimension errors

**Network Errors**:
- [ ] Connection timeout
- [ ] Server unavailable
- [ ] Network error
- [ ] Retry mechanism

### 3. Recovery Testing

**Error Recovery**:
- [ ] Users can fix errors
- [ ] Error messages are clear
- [ ] Retry mechanisms work
- [ ] Data is not lost

**Graceful Degradation**:
- [ ] Partial functionality works
- [ ] Fallback mechanisms work
- [ ] User experience maintained
- [ ] Error reporting works

## Documentation Testing

### 1. API Documentation

**Completeness**:
- [ ] All endpoints documented
- [ ] Request/response schemas
- [ ] Error codes documented
- [ ] Examples provided

**Accuracy**:
- [ ] Examples work
- [ ] Schemas correct
- [ ] Error codes correct
- [ ] Parameters correct

### 2. User Documentation

**Completeness**:
- [ ] All features documented
- [ ] Step-by-step instructions
- [ ] Troubleshooting guide
- [ ] FAQ included

**Usability**:
- [ ] Clear instructions
- [ ] Screenshots included
- [ ] Examples provided
- [ ] Search functionality

## Performance Testing

### 1. Load Testing

**Concurrent Users**:
- [ ] 10 concurrent users
- [ ] 50 concurrent users
- [ ] 100 concurrent users
- [ ] 500 concurrent users

**Response Times**:
- [ ] API responses < 1 second
- [ ] Pass generation < 10 seconds
- [ ] File uploads < 5 seconds
- [ ] Database queries < 100ms

### 2. Stress Testing

**Resource Limits**:
- [ ] Memory usage limits
- [ ] CPU usage limits
- [ ] Disk space limits
- [ ] Network bandwidth limits

**Failure Points**:
- [ ] Database connection limits
- [ ] File system limits
- [ ] Memory limits
- [ ] CPU limits

## Security Testing

### 1. Input Validation

**File Uploads**:
- [ ] PNG files accepted
- [ ] Non-PNG files rejected
- [ ] Large files handled
- [ ] Malicious files rejected

**API Inputs**:
- [ ] Valid data accepted
- [ ] Invalid data rejected
- [ ] SQL injection prevented
- [ ] XSS prevented

### 2. Authentication

**Access Control**:
- [ ] Unauthorized access blocked
- [ ] Rate limiting works
- [ ] Error messages secure
- [ ] Logs don't leak info

**Certificate Security**:
- [ ] Certificates loaded securely
- [ ] Private keys protected
- [ ] Signing works correctly
- [ ] Invalid certificates rejected

## Final Checklist

### 1. Pre-Release

- [ ] All tests pass
- [ ] Documentation complete
- [ ] Security review done
- [ ] Performance acceptable
- [ ] Error handling complete

### 2. Release

- [ ] Production environment ready
- [ ] Monitoring configured
- [ ] Backup procedures ready
- [ ] Rollback plan ready
- [ ] Team notified

### 3. Post-Release

- [ ] Monitor metrics
- [ ] Watch for errors
- [ ] User feedback collected
- [ ] Performance monitored
- [ ] Security monitored

## Test Data

### Sample Variables

**Stamp Card**:
```json
{
  "brandName": "Example Corp",
  "stampCount": 3,
  "stampTarget": 8,
  "rewardText": "Free coffee",
  "barcodeMessage": "stamp-card-123",
  "barcodeAltText": "Stamp card 123"
}
```

**Coupon**:
```json
{
  "offerText": "20% off your next purchase",
  "expiryDate": "2024-12-31",
  "couponCode": "SAVE20",
  "brandName": "Example Corp"
}
```

**Membership**:
```json
{
  "memberName": "John Doe",
  "membershipTier": "Gold",
  "memberId": "M123456789",
  "expiryDate": "2024-12-31",
  "brandName": "Example Corp"
}
```

### Test Images

**Required Images**:
- icon.png (29×29)
- icon@2x.png (58×58)

**Optional Images**:
- logo.png (160×50)
- logo@2x.png (320×100)
- strip.png (320×84)
- strip@2x.png (640×168)
- background.png (180×220)
- background@2x.png (360×440)
- thumbnail.png (90×90)
- thumbnail@2x.png (180×180)

## Troubleshooting

### Common Issues

1. **Pass won't install**:
   - Check certificate validity
   - Verify pass.json structure
   - Validate signature

2. **Images not displaying**:
   - Check image dimensions
   - Verify PNG format
   - Check file names

3. **Barcode not scanning**:
   - Check message encoding
   - Verify barcode format
   - Test with different scanners

4. **API errors**:
   - Check logs
   - Verify database connection
   - Check file permissions

### Debug Commands

```bash
# Check pass structure
unzip -l pass.pkpass

# Validate pass
pnpm cli validate --file pass.pkpass

# Check logs
tail -f logs/api.log

# Check database
pnpm --filter db studio
```
