# Error Handling Guide

## Rate Limit Errors

### Anthropic API Rate Limits
- **Default limit**: 40,000 input tokens per minute
- **Error code**: 429 (Too Many Requests)
- **Error message**: Contains "rate limit" or "rate_limit"

### How Rate Limits Are Handled

#### Server-Side (`app/api/chat/route.ts`)
1. **Detection**: The `isRateLimitError()` function checks for:
   - Error messages containing "rate limit"
   - HTTP 429 status codes
   - `maxRetriesExceeded` reason with rate limit in lastError

2. **Response**: Returns a 429 status with clear error message:
   ```json
   {
     "error": "Rate Limit Exceeded",
     "message": "You've exceeded the rate limit for the Anthropic API...",
     "details": "Rate limit: 40,000 input tokens per minute"
   }
   ```

3. **Cleanup**: Automatically kills the browser session to free resources

#### Client-Side (`app/page.tsx`)
1. **Detection**: Checks error message for rate limit indicators
2. **User Feedback**: Shows specific toast notification with:
   - Clear "Rate limit exceeded" title
   - Actionable message to wait and retry
   - 5-second duration for visibility

### How to Reduce Rate Limit Issues

1. **Reduce Token Usage**:
   - Minimize message history with `prunedMessages()` utility
   - Use shorter system prompts
   - Limit `maxSteps` parameter (currently 30)

2. **Implement Request Queuing**:
   - Add a queue system to throttle requests
   - Implement exponential backoff on retries

3. **Cache Control**:
   - Using `cacheControl: { type: "ephemeral" }` helps reduce repeated content costs

4. **Monitor Usage**:
   - Check response headers for current usage
   - Log token consumption per request

5. **Upgrade Plan**:
   - Contact Anthropic sales for higher rate limits
   - Consider enterprise pricing for production use

### Example Error Structure

```javascript
{
  name: 'AI_RetryError',
  reason: 'maxRetriesExceeded',
  errors: [...],
  lastError: {
    name: 'AI_APICallError',
    message: 'This request would exceed the rate limit...',
    cause: undefined,
    url: 'https://api.anthropic.com/v1/messages',
    statusCode: 429
  }
}
```

### Testing Rate Limit Handling

To test the rate limit handling:
1. Send multiple rapid requests
2. Use large prompts or long message histories
3. Verify the 429 response and user notification appear
4. Confirm browser cleanup occurs
