# KDF eShop Backend — API Documentation

**Base URL:** `http://localhost:3000/api/v1`  
**Auth header:** `Authorization: Bearer <accessToken>`  
**Content-Type:** `application/json` (unless noted)

---

## Table of Contents

- [Auth](#auth)
- [Users](#users)
- [Sessions](#sessions)
- [Roles](#roles)
- [Role Access Rights](#role-access-rights)
- [Access Rights](#access-rights)

---

## Auth

### POST `/auth/register`
Self-registration for **pending** users only. Sets email and password for an account already created by admin or bulk upload.

**Body**
```json
{
  "service_number": "SVC-001",
  "email": "user@example.com",
  "password": "Pass@1234",
  "confirm_password": "Pass@1234"
}
```

**Response `201`**
```json
{
  "success": true,
  "message": "Registration successful. You can now login.",
  "data": {
    "id": 2,
    "serviceNumber": "SVC-001",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "status": "active",
    "roleId": "uuid",
    "phone": null,
    "rank": null,
    "unit": null,
    "createdAt": "2026-04-30T08:00:00.000Z",
    "updatedAt": "2026-04-30T08:05:00.000Z"
  }
}
```

---

### POST `/auth/login`
Logs in a user. Invalidates all previous active sessions and creates a new one. Location and coordinates are stored in the session.

**Body**
```json
{
  "service_number": "ADMIN-001",
  "password": "Admin@1234",
  "device_info": "Chrome 124 / Android",
  "location": "Nairobi, Kenya",
  "lat": -1.286389,
  "lng": 36.817223
}
```

> `device_info`, `location`, `lat`, `lng` are optional. `device_info` is auto-captured from `User-Agent` if omitted.

**Response `200`**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "a3f9b2c1d4e5f6...",
    "user": {
      "id": 1,
      "serviceNumber": "ADMIN-001",
      "email": "admin@kdfeshop.com",
      "firstName": "System",
      "lastName": "Admin",
      "status": "active",
      "roleId": "uuid",
      "phone": null,
      "rank": null,
      "unit": null,
      "createdAt": "2026-04-29T10:00:00.000Z",
      "updatedAt": "2026-04-29T10:00:00.000Z"
    }
  }
}
```

---

### POST `/auth/logout`
Marks the current session as `logged_out`.

**Headers:** `Authorization: Bearer <accessToken>`  
**Body:** none

**Response `200`**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### POST `/auth/refresh-token`
Returns a new access token using the refresh token. Extends session by another 7 days (rolling).

**Body**
```json
{
  "refresh_token": "a3f9b2c1d4e5f6..."
}
```

**Response `200`**
```json
{
  "success": true,
  "message": "Token refreshed",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "b8c1d2e3f4a5b6..."
  }
}
```

---

### POST `/auth/forgot-password`
Sends a 6-digit OTP to the user's registered email. OTP expires in 10 minutes.

**Body**
```json
{
  "email": "user@example.com"
}
```

**Response `200`**
```json
{
  "success": true,
  "message": "If the email exists, an OTP has been sent"
}
```

---

### POST `/auth/reset-password`
Resets password using service number + OTP received by email.

**Body**
```json
{
  "service_number": "SVC-001",
  "otp": "482910",
  "new_password": "NewPass@1234",
  "confirm_password": "NewPass@1234"
}
```

**Response `200`**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

---

## Users

> All endpoints require `Authorization: Bearer <accessToken>`

### GET `/users/bulk-template`
Downloads an Excel `.xlsx` template for bulk user upload.

**Response:** Binary Excel file download  
**Filename:** `users_upload_template.xlsx`

**Template columns:**

| Column | Required |
|--------|----------|
| service_number | Yes |
| first_name | Yes |
| last_name | No |
| email | No |
| phone | No |
| rank | No |
| unit | No |

> Role is not in the template. All bulk-uploaded users are assigned the `customer` role automatically (created if it doesn't exist).

---

### POST `/users/bulk-upload`
Uploads an Excel file and creates users in **pending** status.

**Content-Type:** `multipart/form-data`  
**Field name:** `file` (`.xlsx` or `.xls`, max 5 MB)

**Response `201`**
```json
{
  "success": true,
  "message": "Bulk upload completed",
  "data": {
    "total": 10,
    "created": 8,
    "skipped": 2,
    "errors": [
      { "row": 3, "serviceNumber": "SVC-003", "reason": "Service number already exists" },
      { "row": 7, "reason": "Missing required fields: service_number, first_name" }
    ]
  }
}
```

---

### POST `/users`
Admin creates a single user. Password is set to the service number automatically.

**Body**
```json
{
  "service_number": "SVC-010",
  "first_name": "Jane",
  "last_name": "Doe",
  "email": "jane.doe@example.com",
  "phone": "+254700000001",
  "rank": "Major",
  "unit": "Unit Bravo",
  "role_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

> `first_name`, `last_name`, `email`, `phone`, `rank`, `unit`, `role_id` are all optional.

**Response `201`**
```json
{
  "success": true,
  "message": "User created. Default password is the service number (SVC-010). Ask the user to change it after first login.",
  "data": {
    "id": 5,
    "serviceNumber": "SVC-010",
    "email": "jane.doe@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "status": "active",
    "roleId": "550e8400-e29b-41d4-a716-446655440000",
    "phone": "+254700000001",
    "rank": "Major",
    "unit": "Unit Bravo",
    "createdAt": "2026-04-30T08:00:00.000Z",
    "updatedAt": "2026-04-30T08:00:00.000Z"
  }
}
```

---

### GET `/users`
Paginated list of all users with optional filters.

**Query Params**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| page | number | No | Default: `1` |
| limit | number | No | Default: `10`, max `100` |
| status | string | No | `pending` \| `active` \| `deactivated` \| `suspended` |
| role_id | uuid | No | Filter by role |
| search | string | No | Searches service_number, first_name, last_name, email |

**Example:** `GET /users?page=1&limit=10&status=active&search=john`

**Response `200`**
```json
{
  "success": true,
  "message": "Users fetched",
  "data": {
    "items": [
      {
        "id": 1,
        "serviceNumber": "ADMIN-001",
        "email": "admin@kdfeshop.com",
        "firstName": "System",
        "lastName": "Admin",
        "phone": null,
        "rank": null,
        "unit": null,
        "status": "active",
        "roleId": "uuid",
        "createdAt": "2026-04-29T10:00:00.000Z",
        "updatedAt": "2026-04-29T10:00:00.000Z",
        "role": { "id": "uuid", "name": "admin" }
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### GET `/users/:id`
Get a single user by ID, including full role details.

**Params:** `id` (integer)

**Response `200`**
```json
{
  "success": true,
  "message": "User fetched",
  "data": {
    "id": 1,
    "serviceNumber": "ADMIN-001",
    "email": "admin@kdfeshop.com",
    "firstName": "System",
    "lastName": "Admin",
    "phone": null,
    "rank": null,
    "unit": null,
    "status": "active",
    "roleId": "uuid",
    "createdAt": "2026-04-29T10:00:00.000Z",
    "updatedAt": "2026-04-29T10:00:00.000Z",
    "role": {
      "id": "uuid",
      "name": "admin",
      "description": "Full system access"
    }
  }
}
```

---

### PUT `/users/:id`
Admin updates a user's details. Service number and password cannot be changed here.

**Params:** `id` (integer)  
**Body** (all fields optional)
```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane.smith@example.com",
  "phone": "+254700000002",
  "rank": "Colonel",
  "unit": "Unit Charlie",
  "role_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response `200`**
```json
{
  "success": true,
  "message": "User updated",
  "data": { ...updatedUser }
}
```

---

### PATCH `/users/:id/status`
Change a user's account status.

**Params:** `id` (integer)  
**Body**
```json
{
  "status": "active"
}
```

> `status` options: `pending` | `active` | `deactivated` | `suspended`

**Response `200`**
```json
{
  "success": true,
  "message": "User status changed to active",
  "data": { ...updatedUser }
}
```

---

## Sessions

> All endpoints require `Authorization: Bearer <accessToken>`

### GET `/sessions`
Paginated list of all sessions with filters.

**Query Params**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| page | number | No | Default: `1` |
| limit | number | No | Default: `10`, max `100` |
| user_id | number | No | Filter by user |
| status | string | No | `active` \| `deactivated` \| `logged_out` \| `expired` |
| start_date | string | No | ISO date e.g. `2026-01-01` |
| end_date | string | No | ISO date e.g. `2026-12-31` |

**Example:** `GET /sessions?status=active&user_id=1&start_date=2026-04-01`

**Response `200`**
```json
{
  "success": true,
  "message": "Sessions fetched",
  "data": {
    "items": [
      {
        "id": 1,
        "userId": 1,
        "deviceInfo": "Mozilla/5.0...",
        "ipAddress": "127.0.0.1",
        "location": "Nairobi, Kenya",
        "lat": -1.286389,
        "lng": 36.817223,
        "status": "active",
        "expiresAt": "2026-05-07T08:00:00.000Z",
        "createdAt": "2026-04-30T08:00:00.000Z",
        "updatedAt": "2026-04-30T08:00:00.000Z",
        "user": {
          "id": 1,
          "serviceNumber": "ADMIN-001",
          "firstName": "System",
          "lastName": "Admin"
        }
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### PUT `/sessions/:id/deactivate`
Deactivates a specific session, forcing the user to log in again.

**Params:** `id` (integer)  
**Body:** none

**Response `200`**
```json
{
  "success": true,
  "message": "Session deactivated",
  "data": {
    "id": 1,
    "userId": 1,
    "status": "deactivated",
    "updatedAt": "2026-04-30T09:00:00.000Z"
  }
}
```

---

## Roles

> All endpoints require `Authorization: Bearer <accessToken>`

### GET `/roles`
List all roles.

**Response `200`**
```json
{
  "success": true,
  "message": "Roles fetched",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "admin",
      "description": "Full system access",
      "createdAt": "2026-04-29T10:00:00.000Z",
      "updatedAt": "2026-04-29T10:00:00.000Z"
    }
  ]
}
```

---

### POST `/roles`
Create a new role.

**Body**
```json
{
  "name": "manager",
  "description": "Manages store operations"
}
```

> `name` is required and must be unique. `description` is optional.

**Response `201`**
```json
{
  "success": true,
  "message": "Role created",
  "data": {
    "id": "uuid",
    "name": "manager",
    "description": "Manages store operations",
    "createdAt": "2026-04-30T08:00:00.000Z",
    "updatedAt": "2026-04-30T08:00:00.000Z"
  }
}
```

---

### GET `/roles/:id`
Get a role by ID. Includes assigned access rights.

**Params:** `id` (UUID)

**Response `200`**
```json
{
  "success": true,
  "message": "Role fetched",
  "data": {
    "id": "uuid",
    "name": "admin",
    "description": "Full system access",
    "createdAt": "2026-04-29T10:00:00.000Z",
    "updatedAt": "2026-04-29T10:00:00.000Z",
    "accessRights": [
      { "id": 1, "name": "manage_users", "description": "Create, update and delete users" },
      { "id": 2, "name": "view_dashboard", "description": "View admin dashboard" }
    ]
  }
}
```

---

### PUT `/roles/:id`
Update a role.

**Params:** `id` (UUID)  
**Body** (all fields optional)
```json
{
  "name": "super-admin",
  "description": "Updated description"
}
```

**Response `200`**
```json
{
  "success": true,
  "message": "Role updated",
  "data": { ...updatedRole }
}
```

---

### DELETE `/roles/:id`
Delete a role.

**Params:** `id` (UUID)

**Response `200`**
```json
{
  "success": true,
  "message": "Role deleted",
  "data": { ...deletedRole }
}
```

---

## Role Access Rights

> All endpoints require `Authorization: Bearer <accessToken>`

### GET `/roles/:id/access-rights`
Get all access rights assigned to a role.

**Params:** `id` (UUID)

**Response `200`**
```json
{
  "success": true,
  "message": "Access rights fetched",
  "data": [
    { "id": 1, "name": "manage_users", "description": "Create, update and delete users" },
    { "id": 3, "name": "view_reports", "description": "View reports and analytics" }
  ]
}
```

---

### PUT `/roles/:id/access-rights`
Replace all access rights for a role. Pass an empty array to remove all.

**Params:** `id` (UUID)  
**Body**
```json
{
  "accessRightIds": [1, 3, 5, 7]
}
```

**Response `200`**
```json
{
  "success": true,
  "message": "Access rights assigned",
  "data": {
    "id": "uuid",
    "name": "admin",
    "description": "Full system access",
    "accessRights": [
      { "id": 1, "name": "manage_users" },
      { "id": 3, "name": "view_reports" }
    ]
  }
}
```

---

## Access Rights

### GET `/access-rights`
List all available access rights. Seeded with 16 default entries.

**Response `200`**
```json
{
  "success": true,
  "message": "Access rights fetched",
  "data": [
    { "id": 1, "name": "manage_coupons", "description": "Create, update and delete coupons", "createdAt": "...", "updatedAt": "..." },
    { "id": 2, "name": "manage_inventory", "description": "Manage product inventory and stock", "createdAt": "...", "updatedAt": "..." }
  ]
}
```

---

## Standard Error Responses

```json
{ "success": false, "message": "Validation failed", "errors": { "field": ["error message"] } }
{ "success": false, "message": "Unauthorized" }
{ "success": false, "message": "Invalid access token" }
{ "success": false, "message": "Access token expired, please refresh" }
{ "success": false, "message": "Session is no longer active" }
{ "success": false, "message": "Not found" }
{ "success": false, "message": "Internal server error" }
```

---

## Token Lifecycle

```
Login
 ├── accessToken  expires in 1h      → sent with every request (Authorization header)
 └── refreshToken expires in 7 days  → used only to get new accessToken

accessToken expired → POST /auth/refresh-token → new accessToken + new refreshToken
refreshToken expired → must login again
```

---

## Available Access Rights (seeded)

| ID | Name | Description |
|----|------|-------------|
| 1 | manage_coupons | Create, update and delete coupons |
| 2 | manage_inventory | Manage product inventory and stock |
| 3 | manage_orders | View and manage orders |
| 4 | manage_payments | View and manage payments |
| 5 | manage_products | Create, update and delete products |
| 6 | manage_roles | Create, update and delete roles |
| 7 | manage_settings | Manage system settings |
| 8 | manage_users | Create, update and delete users |
| 9 | manage_categories | Create, update and delete categories |
| 10 | view_categories | View categories |
| 11 | view_dashboard | View admin dashboard |
| 12 | view_orders | View orders |
| 13 | view_products | View products |
| 14 | view_reports | View reports and analytics |
| 15 | view_roles | View roles list |
| 16 | view_users | View users list |
