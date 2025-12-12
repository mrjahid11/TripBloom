# TripBloom Customer API Examples for Postman

**Base URL:** `http://localhost:5000`

---

## 1. BOOKING ENDPOINTS

### 1.1 Create Booking (GROUP Tour)
**POST** `/api/bookings`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "customerId": "6756a1b2c3d4e5f6g7h8i9j0",
  "packageId": "6756a1b2c3d4e5f6g7h8i9j1",
  "bookingType": "GROUP",
  "groupDepartureId": "6756a1b2c3d4e5f6g7h8i9j2",
  "startDate": "2025-12-20T00:00:00.000Z",
  "endDate": "2025-12-27T00:00:00.000Z",
  "numTravelers": 2,
  "travelers": [
    {
      "fullName": "John Doe",
      "age": 30,
      "phone": "+880 1712345678"
    },
    {
      "fullName": "Jane Doe",
      "age": 28,
      "phone": "+880 1798765432"
    }
  ],
  "totalAmount": 2500,
  "currency": "BDT",
  "reservedSeats": ["A1", "A2"]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "booking": {
    "_id": "675abc123...",
    "customerId": {...},
    "packageId": {...},
    "bookingType": "GROUP",
    "status": "PENDING",
    "totalAmount": 2500,
    "numTravelers": 2,
    "travelers": [...],
    "reservedSeats": ["A1", "A2"],
    "createdAt": "2025-12-12T..."
  }
}
```

---

### 1.2 Create Booking (PRIVATE Tour)
**POST** `/api/bookings`

**Body:**
```json
{
  "customerId": "6756a1b2c3d4e5f6g7h8i9j0",
  "packageId": "6756a1b2c3d4e5f6g7h8i9j1",
  "bookingType": "PRIVATE",
  "startDate": "2025-12-20T00:00:00.000Z",
  "endDate": "2025-12-27T00:00:00.000Z",
  "numTravelers": 4,
  "travelers": [
    {
      "fullName": "Alice Smith",
      "age": 35,
      "phone": "+880 1712345678"
    },
    {
      "fullName": "Bob Smith",
      "age": 37,
      "phone": "+880 1798765432"
    },
    {
      "fullName": "Charlie Smith",
      "age": 10,
      "phone": "+880 1712345678"
    },
    {
      "fullName": "Diana Smith",
      "age": 8,
      "phone": "+880 1712345678"
    }
  ],
  "totalAmount": 5000,
  "currency": "BDT"
}
```

---

### 1.3 Get Booking by ID
**GET** `/api/bookings/:bookingId`

**Example:** `http://localhost:5000/api/bookings/675abc123...`

**Response (200):**
```json
{
  "success": true,
  "booking": {
    "_id": "675abc123...",
    "customerId": {
      "_id": "...",
      "name": "John Customer",
      "email": "john@example.com",
      "phone": "+880 1712345678"
    },
    "packageId": {
      "_id": "...",
      "title": "Paris Adventure",
      "destination": "Paris, France",
      "type": "GROUP",
      "category": null,
      "basePrice": 1250
    },
    "groupDepartureId": {
      "_id": "...",
      "startDate": "2025-12-20",
      "endDate": "2025-12-27",
      "totalSeats": 40,
      "bookedSeats": 15,
      "pricePerPerson": 1250
    },
    "status": "CONFIRMED",
    "totalAmount": 2500,
    "payments": [
      {
        "amount": 2500,
        "method": "BKASH",
        "status": "SUCCESS",
        "paidAt": "2025-12-12T..."
      }
    ]
  }
}
```

---

### 1.4 List Customer Bookings
**GET** `/api/bookings?customerId=:customerId`

**Examples:**
- All bookings: `http://localhost:5000/api/bookings?customerId=6756a1b2c3d4e5f6g7h8i9j0`
- Only confirmed: `http://localhost:5000/api/bookings?customerId=6756a1b2c3d4e5f6g7h8i9j0&status=CONFIRMED`
- Multiple statuses: `http://localhost:5000/api/bookings?customerId=6756a1b2c3d4e5f6g7h8i9j0&status=PENDING,CONFIRMED`
- By package: `http://localhost:5000/api/bookings?customerId=6756a1b2c3d4e5f6g7h8i9j0&packageId=6756a1b2c3d4e5f6g7h8i9j1`
- By booking type: `http://localhost:5000/api/bookings?customerId=6756a1b2c3d4e5f6g7h8i9j0&bookingType=GROUP`

**Response (200):**
```json
{
  "success": true,
  "bookings": [...],
  "count": 5
}
```

---

### 1.5 Update Booking (Traveler Info)
**PUT** `/api/bookings/:bookingId`

**Body:**
```json
{
  "travelers": [
    {
      "fullName": "John Updated Doe",
      "age": 31,
      "phone": "+880 1712345678"
    },
    {
      "fullName": "Jane Updated Doe",
      "age": 29,
      "phone": "+880 1798765432"
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Booking updated successfully",
  "booking": {...}
}
```

---

### 1.6 Cancel Booking
**POST** `/api/bookings/:bookingId/cancel`

**Body:**
```json
{
  "userId": "6756a1b2c3d4e5f6g7h8i9j0",
  "reason": "Change in travel plans"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "booking": {
    "status": "CANCELLED",
    "cancellation": {
      "isCancelled": true,
      "reason": "Change in travel plans",
      "cancelledBy": "6756a1b2c3d4e5f6g7h8i9j0",
      "cancelledAt": "2025-12-12T...",
      "refundAmount": 1875
    }
  },
  "refundAmount": 1875
}
```

---

### 1.7 Add Payment to Booking
**POST** `/api/bookings/:bookingId/payment`

**Body:**
```json
{
  "amount": 1250,
  "method": "BKASH",
  "transactionRef": "BKP12345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Payment added successfully",
  "booking": {
    "payments": [
      {
        "amount": 1250,
        "method": "BKASH",
        "status": "SUCCESS",
        "transactionRef": "BKP12345678",
        "paidAt": "2025-12-12T..."
      }
    ],
    "status": "CONFIRMED"
  }
}
```

---

### 1.8 Get Customer Statistics
**GET** `/api/customers/:customerId/stats`

**Example:** `http://localhost:5000/api/customers/6756a1b2c3d4e5f6g7h8i9j0/stats`

**Response (200):**
```json
{
  "success": true,
  "stats": {
    "total": 12,
    "pending": 2,
    "confirmed": 3,
    "completed": 5,
    "cancelled": 2,
    "totalSpent": 45000,
    "upcomingTrips": 3
  }
}
```

---

## 2. REVIEW ENDPOINTS

### 2.1 Create Review
**POST** `/api/reviews`

**Body:**
```json
{
  "customerId": "6756a1b2c3d4e5f6g7h8i9j0",
  "packageId": "6756a1b2c3d4e5f6g7h8i9j1",
  "bookingId": "675abc123...",
  "rating": 5,
  "comment": "Absolutely amazing experience! The tour guide was knowledgeable, the itinerary was well-planned, and everything exceeded our expectations. Highly recommended for anyone looking for an unforgettable adventure!"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Review submitted successfully. It will be published after moderation.",
  "review": {
    "_id": "675def456...",
    "customerId": {...},
    "packageId": {...},
    "rating": 5,
    "comment": "Absolutely amazing experience!...",
    "verified": true,
    "status": "PENDING",
    "helpful": 0,
    "createdAt": "2025-12-12T..."
  }
}
```

---

### 2.2 Get Review by ID
**GET** `/api/reviews/:reviewId`

**Example:** `http://localhost:5000/api/reviews/675def456...`

**Response (200):**
```json
{
  "success": true,
  "review": {
    "_id": "675def456...",
    "customerId": {
      "_id": "...",
      "name": "John Customer",
      "email": "john@example.com"
    },
    "packageId": {
      "_id": "...",
      "title": "Paris Adventure",
      "destination": "Paris, France",
      "type": "GROUP"
    },
    "rating": 5,
    "comment": "Absolutely amazing...",
    "status": "APPROVED",
    "verified": true,
    "helpful": 15
  }
}
```

---

### 2.3 List Reviews
**GET** `/api/reviews`

**Examples:**
- By package: `http://localhost:5000/api/reviews?packageId=6756a1b2c3d4e5f6g7h8i9j1`
- Approved only: `http://localhost:5000/api/reviews?packageId=6756a1b2c3d4e5f6g7h8i9j1&status=APPROVED`
- By customer: `http://localhost:5000/api/reviews?customerId=6756a1b2c3d4e5f6g7h8i9j0`
- High ratings: `http://localhost:5000/api/reviews?packageId=6756a1b2c3d4e5f6g7h8i9j1&minRating=4`
- Rating range: `http://localhost:5000/api/reviews?packageId=6756a1b2c3d4e5f6g7h8i9j1&minRating=3&maxRating=5`

**Response (200):**
```json
{
  "success": true,
  "reviews": [...],
  "count": 23
}
```

---

### 2.4 Update Review
**PUT** `/api/reviews/:reviewId`

**Body:**
```json
{
  "customerId": "6756a1b2c3d4e5f6g7h8i9j0",
  "rating": 4,
  "comment": "Updated review: Great experience overall, minor issues with hotel but tour was fantastic!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Review updated successfully",
  "review": {...}
}
```

---

### 2.5 Delete Review
**DELETE** `/api/reviews/:reviewId`

**Body:**
```json
{
  "customerId": "6756a1b2c3d4e5f6g7h8i9j0"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Review deleted successfully"
}
```

---

### 2.6 Moderate Review (Admin Only)
**PATCH** `/api/reviews/:reviewId/moderate`

**Body:**
```json
{
  "status": "APPROVED",
  "moderatorNote": "Review is genuine and helpful"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Review approved successfully",
  "review": {
    "status": "APPROVED",
    "moderatorNote": "Review is genuine and helpful"
  }
}
```

---

### 2.7 Mark Review as Helpful
**POST** `/api/reviews/:reviewId/helpful`

**Response (200):**
```json
{
  "success": true,
  "message": "Review marked as helpful",
  "review": {
    "helpful": 16
  }
}
```

---

### 2.8 Get Package Rating Statistics
**GET** `/api/packages/:packageId/rating-stats`

**Example:** `http://localhost:5000/api/packages/6756a1b2c3d4e5f6g7h8i9j1/rating-stats`

**Response (200):**
```json
{
  "success": true,
  "stats": {
    "averageRating": 4.6,
    "totalReviews": 45,
    "ratingDistribution": {
      "5": 28,
      "4": 12,
      "3": 3,
      "2": 1,
      "1": 1
    }
  }
}
```

---

### 2.9 Get Customer's Review for Package
**GET** `/api/customers/:customerId/packages/:packageId/review`

**Example:** `http://localhost:5000/api/customers/6756a1b2c3d4e5f6g7h8i9j0/packages/6756a1b2c3d4e5f6g7h8i9j1/review`

**Response (200):**
```json
{
  "success": true,
  "review": {...} // or null if not reviewed yet
}
```

---

## 3. PACKAGE SEARCH & FILTERING

### 3.1 Search Packages
**GET** `/api/packages/search`

**Examples:**

**All active packages:**
```
http://localhost:5000/api/packages/search
```

**Filter by type:**
```
http://localhost:5000/api/packages/search?type=GROUP
http://localhost:5000/api/packages/search?type=PERSONAL
```

**Filter by category (PERSONAL only):**
```
http://localhost:5000/api/packages/search?type=PERSONAL&category=GOLD
http://localhost:5000/api/packages/search?category=PLATINUM
```

**Search by destination:**
```
http://localhost:5000/api/packages/search?destination=Paris
http://localhost:5000/api/packages/search?destination=japan
```

**Price range:**
```
http://localhost:5000/api/packages/search?minPrice=500&maxPrice=2000
http://localhost:5000/api/packages/search?maxPrice=1500
```

**Duration range:**
```
http://localhost:5000/api/packages/search?minDays=5&maxDays=10
```

**Text search (title, description, destinations):**
```
http://localhost:5000/api/packages/search?search=adventure
http://localhost:5000/api/packages/search?search=beach resort
```

**Combined filters:**
```
http://localhost:5000/api/packages/search?type=GROUP&destination=Europe&minPrice=1000&maxPrice=3000&minDays=7
```

**Response (200):**
```json
{
  "success": true,
  "packages": [
    {
      "_id": "6756a1b2c3d4e5f6g7h8i9j1",
      "title": "Paris Adventure",
      "description": "Explore the city of lights...",
      "type": "GROUP",
      "category": null,
      "basePrice": 1250,
      "defaultDays": 7,
      "defaultNights": 6,
      "destinations": ["Paris", "Versailles", "Mont Saint-Michel"],
      "inclusions": ["Hotel", "Meals", "Guide"],
      "isActive": true
    }
  ],
  "count": 8
}
```

---

## 4. DEPARTURE AVAILABILITY

### 4.1 Check Single Departure Availability
**GET** `/api/departures/:departureId/availability`

**Example:** `http://localhost:5000/api/departures/6756a1b2c3d4e5f6g7h8i9j2/availability`

**Response (200):**
```json
{
  "success": true,
  "availability": {
    "departureId": "6756a1b2c3d4e5f6g7h8i9j2",
    "packageId": "6756a1b2c3d4e5f6g7h8i9j1",
    "packageTitle": "Paris Adventure",
    "startDate": "2025-12-20T00:00:00.000Z",
    "endDate": "2025-12-27T00:00:00.000Z",
    "totalSeats": 40,
    "bookedSeats": 15,
    "availableSeats": 25,
    "pricePerPerson": 1250,
    "status": "OPEN",
    "isAvailable": true,
    "message": "25 seat(s) available"
  }
}
```

**Response when FULL (200):**
```json
{
  "success": true,
  "availability": {
    "departureId": "...",
    "totalSeats": 40,
    "bookedSeats": 40,
    "availableSeats": 0,
    "status": "FULL",
    "isAvailable": false,
    "message": "This departure is fully booked"
  }
}
```

---

### 4.2 Get All Available Departures for Package
**GET** `/api/packages/:packageId/departures/available`

**Example:** `http://localhost:5000/api/packages/6756a1b2c3d4e5f6g7h8i9j1/departures/available`

**Response (200):**
```json
{
  "success": true,
  "departures": [
    {
      "departureId": "6756a1b2c3d4e5f6g7h8i9j2",
      "startDate": "2025-12-20T00:00:00.000Z",
      "endDate": "2025-12-27T00:00:00.000Z",
      "totalSeats": 40,
      "bookedSeats": 15,
      "availableSeats": 25,
      "pricePerPerson": 1250,
      "status": "OPEN"
    },
    {
      "departureId": "6756a1b2c3d4e5f6g7h8i9j3",
      "startDate": "2026-01-10T00:00:00.000Z",
      "endDate": "2026-01-17T00:00:00.000Z",
      "totalSeats": 40,
      "bookedSeats": 8,
      "availableSeats": 32,
      "pricePerPerson": 1250,
      "status": "OPEN"
    }
  ],
  "count": 2
}
```

---

## 5. TESTING WORKFLOW IN POSTMAN

### Step 1: Get Package IDs
First, search for packages to get valid IDs:
```
GET http://localhost:5000/api/packages/search
```

### Step 2: Check Available Departures
For GROUP packages, get available departures:
```
GET http://localhost:5000/api/packages/{packageId}/departures/available
```

### Step 3: Create User/Customer
Use existing user endpoints:
```
POST http://localhost:5000/api/signup
```

### Step 4: Create a Booking
Use the package and departure IDs from steps 1-2:
```
POST http://localhost:5000/api/bookings
```

### Step 5: View Booking History
```
GET http://localhost:5000/api/bookings?customerId={customerId}
```

### Step 6: Add Payment
```
POST http://localhost:5000/api/bookings/{bookingId}/payment
```

### Step 7: Complete the Trip (Manually set end date to past)
After trip ends, submit review:
```
POST http://localhost:5000/api/reviews
```

### Step 8: View Reviews
```
GET http://localhost:5000/api/reviews?packageId={packageId}&status=APPROVED
```

---

## 6. ERROR RESPONSES

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Customer ID, package ID, rating, and comment are required"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Booking not found"
}
```

**Validation Error:**
```json
{
  "success": false,
  "message": "Only 5 seats available. You requested 10 seats."
}
```

---

## Notes:
- Replace MongoDB ObjectId examples (`6756a1b2c3d4e5f6g7h8i9j0`) with actual IDs from your database
- Make sure to create users, packages, and departures first
- Server must be running: `cd backend && node index.js`
- All dates should be in ISO 8601 format
- Payment methods: BKASH, NAGAD, ROCKET, CARD, BANK_TRANSFER, CASH
- Booking statuses: PENDING, CONFIRMED, CANCELLED, COMPLETED, REFUNDED
- Review statuses: PENDING, APPROVED, REJECTED
