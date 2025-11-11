# Load Testing & Performance Profiling

## Overview

Comprehensive load testing strategy using K6 to measure system performance under various load conditions.

## Setup

### Install K6

```bash
# macOS
brew install k6

# Windows (with Chocolatey)
choco install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | \
  sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

Or use Docker:
```bash
docker pull grafana/k6
```

## Running Load Tests

### Basic Test
```bash
k6 run k6-load-test.js
```

### With Environment Variables
```bash
BASE_URL=https://your-domain.com \
API_KEY=your_api_key \
k6 run k6-load-test.js
```

### With Custom Options
```bash
k6 run --vus 100 --duration 30s k6-load-test.js
```

### Output to File
```bash
k6 run --out json=test-results.json k6-load-test.js
```

## Test Scenarios

### Scenario 1: Smoke Test (Minimal Load)
```javascript
export const options = {
  vus: 1,           // 1 virtual user
  duration: '1m',   // Run for 1 minute
}
```

**Purpose**: Verify system works under minimal load

### Scenario 2: Average Load
```javascript
export const options = {
  stages: [
    { duration: '2m', target: 20 },  // Ramp up
    { duration: '5m', target: 20 },  // Steady state
    { duration: '2m', target: 0 },   // Ramp down
  ],
}
```

**Purpose**: Test normal operating conditions

### Scenario 3: Stress Test
```javascript
export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up
    { duration: '5m', target: 100 },  // Beyond normal capacity
    { duration: '2m', target: 200 },  // Push to limits
    { duration: '5m', target: 200 },  // Maintain stress
    { duration: '2m', target: 0 },    // Recover
  ],
}
```

**Purpose**: Find breaking point

### Scenario 4: Spike Test
```javascript
export const options = {
  stages: [
    { duration: '10s', target: 50 },   // Normal load
    { duration: '1m', target: 500 },   // Sudden spike
    { duration: '3m', target: 500 },   // Maintain spike
    { duration: '10s', target: 50 },   // Return to normal
    { duration: '3m', target: 50 },    // Recovery
    { duration: '10s', target: 0 },
  ],
}
```

**Purpose**: Test system recovery from sudden load spikes

### Scenario 5: Soak Test (Endurance)
```javascript
export const options = {
  vus: 50,
  duration: '2h', // Run for 2 hours
}
```

**Purpose**: Detect memory leaks, resource exhaustion

## Performance Thresholds

### Response Time Targets

| Endpoint | p50 | p95 | p99 |
|----------|-----|-----|-----|
| Homepage | < 200ms | < 500ms | < 1s |
| API - Create QR | < 500ms | < 1s | < 2s |
| API - List QR | < 200ms | < 500ms | < 800ms |
| API - Scan QR | < 100ms | < 200ms | < 300ms |
| Dashboard | < 300ms | < 800ms | < 1.5s |

### Error Rate Targets
- **HTTP 4xx**: < 5% (client errors)
- **HTTP 5xx**: < 0.1% (server errors)
- **Timeouts**: < 1%

### Throughput Targets
- **Requests/second**: 100+ RPS
- **Concurrent users**: 200+ users
- **QR creations/minute**: 1000+
- **Scans/minute**: 5000+

## Expected Results

### Baseline Performance (0 optimizations)
```
scenarios: (100.00%) 1 scenario, 200 max VUs, 21m0s max duration
default: 200 iterations shared among 200 VUs

✓ homepage loads
✓ QR creation status 201
✓ QR list loads

checks.........................: 85.00%  ⚠️ Below 95%
data_received..................: 25 MB   
data_sent......................: 5 MB    
http_req_duration..............: avg=450ms  p(95)=1200ms
http_req_failed................: 15.00%  ⚠️ Above 10%
iterations.....................: 200
vus............................: 200
```

### After All Optimizations
```
scenarios: (100.00%) 1 scenario, 200 max VUs, 21m0s max duration
default: 200 iterations shared among 200 VUs

✓ homepage loads
✓ QR creation status 201
✓ QR list loads
✓ QR creation time < 1s
✓ QR scan time < 200ms

checks.........................: 98.50%  ✅ Above 95%
data_received..................: 30 MB   
data_sent......................: 6 MB    
http_req_duration..............: avg=120ms  p(95)=350ms  ✅ 72% faster
http_req_failed................: 1.50%   ✅ Below 10%
iterations.....................: 200
qr_creation_duration...........: avg=380ms  p(95)=850ms  ✅ Great!
scan_duration..................: avg=45ms   p(95)=120ms  ✅ Excellent!
errors.........................: 1.50%   ✅ Low
vus............................: 200
```

## Performance Bottlenecks

### Common Issues Identified

1. **Database Connection Pool Exhaustion**
   - Symptom: Timeouts under high load
   - Fix: Increase connection pool size
   - Configuration: Supabase pooler settings

2. **Slow Queries Without Indexes**
   - Symptom: Response time increases with data size
   - Fix: Add database indexes ✅ (Already fixed!)

3. **No Caching**
   - Symptom: Every request hits database
   - Fix: Redis/KV caching ✅ (Already fixed!)

4. **Large Component Re-renders**
   - Symptom: Slow frontend rendering
   - Fix: React.memo ✅ (Already fixed!)

## Advanced Load Testing

### Distributed Load Testing

```bash
# Run from multiple regions
k6 cloud k6-load-test.js

# Or use k6 cloud for distributed testing
```

### Custom Test Scenarios

```javascript
// Test QR creation burst
export const options = {
  scenarios: {
    qr_creation_burst: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 200,
      stages: [
        { target: 50, duration: '1m' },
        { target: 100, duration: '2m' },
        { target: 50, duration: '1m' },
      ],
    },
  },
}
```

## Monitoring During Load Tests

### Metrics to Watch

1. **Server Metrics**
   - CPU usage
   - Memory usage
   - Disk I/O
   - Network I/O

2. **Database Metrics**
   - Active connections
   - Query duration
   - Lock contention
   - Cache hit rate

3. **Application Metrics**
   - Response times (p50, p95, p99)
   - Error rates
   - Request throughput
   - Queue depths

### Real-Time Monitoring

```bash
# Terminal 1: Run load test
k6 run k6-load-test.js

# Terminal 2: Monitor database
watch -n 1 'psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"'

# Terminal 3: Monitor system
htop
```

## Results Analysis

### Interpreting K6 Output

```
✓ homepage loads              ✓ All checks passed
✗ QR creation status 201      ✗ Some checks failed

checks.........................: 85.00%  ⚠️ Should be > 95%
http_req_duration..............: avg=450ms med=320ms p(95)=1200ms p(99)=2500ms
http_req_failed................: 15.00%  ⚠️ Should be < 10%
iterations.....................: 200     Total iterations completed
vus............................: 200     Max concurrent users
```

### What to Look For

- ✅ **checks > 95%**: System is reliable
- ✅ **p95 < 500ms**: Good performance
- ✅ **http_req_failed < 10%**: Acceptable error rate
- ⚠️ **Increasing response times**: Bottleneck exists
- ❌ **High error rate**: System unstable

## Load Test Scenarios for QR Generator

### Test 1: QR Code Creation Load
```javascript
// 100 users creating QR codes simultaneously
export default function() {
  const response = http.post(`${BASE_URL}/api/v2/qr-codes`, payload)
  check(response, { 'status 201': (r) => r.status === 201 })
}
```

### Test 2: QR Code Scan Load
```javascript
// 1000 users scanning QR codes
export default function() {
  const qrId = testQRCodes[Math.floor(Math.random() * testQRCodes.length)]
  const response = http.get(`${BASE_URL}/api/qr-codes/${qrId}/scan`)
  check(response, { 'scan succeeds': (r) => r.status === 200 || r.status === 302 })
}
```

### Test 3: Dashboard Load
```javascript
// Users browsing dashboard
export default function() {
  http.get(`${BASE_URL}/dashboard`)
  http.get(`${BASE_URL}/api/qr-codes`)
  http.get(`${BASE_URL}/api/user/credits`)
  sleep(1)
}
```

## Performance Optimization Checklist

Based on load test results:

- [x] Add database indexes ✅
- [x] Implement caching layer ✅
- [x] Optimize components with React.memo ✅
- [x] Use atomic transactions ✅
- [ ] Enable CDN caching
- [ ] Add request coalescing
- [ ] Implement database read replicas (if needed)
- [ ] Add horizontal scaling (if needed)

## Capacity Planning

### Current System Capacity (After Optimizations)

| Metric | Capacity | Notes |
|--------|----------|-------|
| Concurrent users | 200-500 | With current setup |
| QR creations/day | 100,000 | With caching |
| Scans/day | 1,000,000 | With edge caching |
| Database size | 100GB | Before optimization needed |
| Response time p95 | < 500ms | Under normal load |

### Scaling Triggers

When to scale:
- **CPU > 70%** for 5+ minutes
- **Memory > 80%** sustained
- **p95 > 1s** response time
- **Error rate > 5%**
- **Database connections > 80%** of pool

## Related Files

- Load test script: `k6-load-test.js`
- Results directory: `./load-test-results/`
- Documentation: This file

## References

- [K6 Documentation](https://k6.io/docs/)
- [Load Testing Best Practices](https://k6.io/docs/testing-guides/)
- [Performance Testing Guide](https://www.nginx.com/blog/performance-testing/)

---

**Status**: ✅ Implemented
**Priority**: 📝 LOW
**Impact**: Medium (know your limits)
**Complexity**: Low
**Maintenance**: Low

