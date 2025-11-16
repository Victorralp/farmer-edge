# API Documentation

Base URL: `http://localhost:5000/api` (development)

All authenticated endpoints require a Firebase ID token in the Authorization header:
```
Authorization: Bearer <firebase-id-token>
```

## Authentication Endpoints

### POST /auth/register
Create user profile after Firebase Authentication signup.

**Headers:**
- Authorization: Bearer <token> (required)

**Body:**
```json
{
  "name": "John Doe",
  "phone": "08012345678",
  "role": "farmer", // or "buyer" or "admin"
  "location": {
    "state": "Lagos",
    "lga": "Ikeja"
  }
}
```

**Response:** `201 Created`
```json
{
  "message": "User profile created successfully",
  "user": {
    "uid": "user-id",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "farmer",
    ...
  }
}
```

### GET /auth/profile
Get current user profile.

**Response:** `200 OK`
```json
{
  "uid": "user-id",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "farmer",
  "location": {...},
  ...
}
```

### PUT /auth/profile
Update user profile.

**Body:**
```json
{
  "name": "Jane Doe",
  "phone": "08087654321",
  "bio": "Organic farmer"
}
```

### POST /auth/verify
Mark email as verified.

**Response:** `200 OK`

---

## Listings Endpoints

### GET /listings
Get all active listings (public, no auth required).

**Query Parameters:**
- `type`: Filter by produce type
- `location`: Filter by state
- `minPrice`: Minimum price
- `maxPrice`: Maximum price
- `search`: Search in title/description

**Response:** `200 OK`
```json
{
  "listings": [...],
  "total": 42
}
```

### GET /listings/:id
Get single listing details.

**Response:** `200 OK`
```json
{
  "id": "listing-id",
  "title": "Fresh Tomatoes",
  "price": 500,
  "quantity": 100,
  "unit": "kg",
  "farmer": {
    "name": "John Doe",
    "location": {...}
  },
  ...
}
```

### POST /listings
Create new listing (farmers only).

**Headers:**
- Content-Type: multipart/form-data

**Form Data:**
- `title`: string (required)
- `description`: string
- `type`: string (required)
- `price`: number (required)
- `quantity`: number (required)
- `unit`: string (required)
- `location`: JSON string (required)
- `image`: file (optional, max 5MB)

**Response:** `201 Created`

### PUT /listings/:id
Update listing (owner or admin).

**Response:** `200 OK`

### DELETE /listings/:id
Delete listing (owner or admin).

**Response:** `200 OK`

### GET /listings/my/listings
Get farmer's own listings (farmers only).

**Response:** `200 OK`

### POST /listings/:id/view
Increment view count.

**Response:** `200 OK`

---

## Orders Endpoints

### POST /orders
Create new order (buyers only).

**Body:**
```json
{
  "listingId": "listing-id",
  "quantity": 10,
  "message": "When can I pick up?",
  "deliveryAddress": "123 Main St, Lagos"
}
```

**Response:** `201 Created`

### GET /orders/buyer
Get buyer's orders.

**Response:** `200 OK`

### GET /orders/farmer
Get farmer's orders.

**Response:** `200 OK`

### GET /orders/:id
Get single order.

**Response:** `200 OK`

### PUT /orders/:id/status
Update order status.

**Body:**
```json
{
  "status": "accepted" // or "declined", "shipped", "completed", "cancelled"
}
```

**Authorization:**
- Farmers can: accept, decline, ship
- Buyers can: complete, cancel

**Response:** `200 OK`

### DELETE /orders/:id
Cancel order (buyer only, pending orders).

**Response:** `200 OK`

---

## Messages Endpoints

### POST /messages
Send message.

**Body:**
```json
{
  "recipientId": "user-id",
  "orderId": "order-id", // optional
  "content": "Hello, is this still available?"
}
```

**Response:** `201 Created`

### GET /messages/conversations
Get user's conversations.

**Response:** `200 OK`
```json
{
  "conversations": [
    {
      "id": "conv-id",
      "participants": ["uid1", "uid2"],
      "lastMessage": "...",
      "lastMessageAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### GET /messages/conversation/:conversationId
Get messages in a conversation.

**Response:** `200 OK`

### GET /messages/unread/count
Get unread message count.

**Response:** `200 OK`
```json
{
  "unreadCount": 5
}
```

### DELETE /messages/:id
Delete message (sender only).

**Response:** `200 OK`

---

## Admin Endpoints

All admin endpoints require admin role.

### GET /admin/stats
Get platform statistics.

**Response:** `200 OK`
```json
{
  "users": {
    "total": 1000,
    "farmers": 400,
    "buyers": 590,
    "admins": 10
  },
  "listings": {
    "total": 500,
    "active": 450
  },
  "orders": {
    "total": 2000,
    "pending": 50,
    "completed": 1800
  },
  "revenue": {
    "total": 5000000,
    "currency": "NGN"
  }
}
```

### GET /admin/users
Get all users.

**Query Parameters:**
- `role`: Filter by role

**Response:** `200 OK`

### PUT /admin/users/:uid/status
Activate/deactivate user.

**Body:**
```json
{
  "active": true
}
```

**Response:** `200 OK`

### PUT /admin/users/:uid/role
Update user role.

**Body:**
```json
{
  "role": "farmer"
}
```

**Response:** `200 OK`

### DELETE /admin/users/:uid
Delete user.

**Response:** `200 OK`

### GET /admin/listings
Get all listings.

**Response:** `200 OK`

### PUT /admin/listings/:id/moderate
Moderate listing.

**Body:**
```json
{
  "status": "active", // or "inactive", "suspended"
  "reason": "Optional reason"
}
```

**Response:** `200 OK`

### GET /admin/orders
Get all orders.

**Query Parameters:**
- `status`: Filter by status

**Response:** `200 OK`

---

## Error Responses

All endpoints may return these error responses:

### 400 Bad Request
```json
{
  "error": "Missing required fields: title, price"
}
```

### 401 Unauthorized
```json
{
  "error": "No token provided"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions",
  "required": ["admin"],
  "current": "buyer"
}
```

### 404 Not Found
```json
{
  "error": "Listing not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Rate Limiting

All endpoints are rate-limited to 100 requests per 15 minutes per IP address.

**Rate Limit Headers:**
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Time when limit resets

---

## Testing the API

### Using cURL

```bash
# Get listings
curl http://localhost:5000/api/listings

# Create listing (with auth)
curl -X POST http://localhost:5000/api/listings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=Fresh Tomatoes" \
  -F "price=500" \
  -F "quantity=100" \
  -F "unit=kg" \
  -F "type=Vegetables" \
  -F 'location={"state":"Lagos","lga":"Ikeja"}' \
  -F "image=@/path/to/image.jpg"
```

### Using Postman

1. Import the API endpoints
2. Set up environment variables:
   - `API_URL`: http://localhost:5000/api
   - `TOKEN`: Your Firebase ID token
3. Use `{{API_URL}}/listings` in requests
4. Set Authorization header: `Bearer {{TOKEN}}`

---

## Webhooks (Future)

### USSD Webhook
**Endpoint:** Cloud Function `ussdWebhook`

**Request:**
```json
{
  "sessionId": "session-id",
  "serviceCode": "*123#",
  "phoneNumber": "+2348012345678",
  "text": "1"
}
```

**Response:**
```
CON Welcome to Farmers Market
1. View Available Produce
2. Check My Orders
3. Contact Support
```

### SMS Webhook
**Endpoint:** Cloud Function `smsWebhook`

**Request:**
```json
{
  "from": "+2348012345678",
  "text": "LIST"
}
```

**Response:**
```json
{
  "message": "Latest Produce:\nFresh Tomatoes - ₦500/kg\n..."
}
```

---

For support or questions, contact: support@farmersmarket.ng
