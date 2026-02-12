# API Reference

All API endpoints are located under `/admin/api/`.

## Authentication

### POST `/admin/api/auth/login.json`

Login and create a session.

**Request:**
```
Content-Type: multipart/form-data

email: string (required)
password: string (required)
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "name": "Admin",
    "role": "admin"
  }
}
```

### POST/GET `/admin/api/auth/logout.json`

Logout and destroy session.

**Response:**
```json
{
  "success": true
}
```

---

## Blog Posts

### POST `/admin/api/blog/create.json`

Create a new blog post.

**Request:**
```
Content-Type: multipart/form-data

title: string (required)
slug: string (required)
content: string (required)
excerpt: string
status: "draft" | "published" (default: "draft")
cover_image: File
categories: string[] (category IDs)
tags: string[] (tag IDs)
meta_title: string
meta_description: string
meta_keywords: string
```

**Response:**
```json
{
  "success": true,
  "post": {
    "id": 1,
    "slug": "my-post"
  }
}
```

### POST `/admin/api/blog/update.json`

Update an existing blog post.

**Request:**
```
Content-Type: multipart/form-data

id: number (required)
title: string
slug: string
content: string
excerpt: string
status: "draft" | "published"
cover_image: File
categories: string[]
tags: string[]
meta_title: string
meta_description: string
```

### DELETE `/admin/api/blog/delete/[id].json`

Delete a blog post.

**Response:**
```json
{
  "success": true
}
```

### POST `/admin/api/blog/duplicate/[id].json`

Duplicate a blog post.

**Response:**
```json
{
  "success": true,
  "post": {
    "id": 2,
    "slug": "my-post-copy"
  }
}
```

---

## Images

### POST `/admin/api/upload-image.json`

Upload an image to R2.

**Request:**
```
Content-Type: multipart/form-data

file: File (required)
```

**Response:**
```json
{
  "success": true,
  "url": "https://your-bucket.r2.dev/images/abc123.jpg",
  "filename": "abc123.jpg"
}
```

### GET `/admin/api/list-images.json`

List all uploaded images.

**Response:**
```json
{
  "success": true,
  "images": [
    {
      "key": "images/abc123.jpg",
      "url": "https://your-bucket.r2.dev/images/abc123.jpg",
      "size": 12345,
      "uploaded": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### DELETE `/admin/api/delete-image.json`

Delete an image from R2.

**Request:**
```json
{
  "key": "images/abc123.jpg"
}
```

**Response:**
```json
{
  "success": true
}
```

---

## TypeScript Types

```typescript
import type { BlogPost, BlogCategory, BlogTag } from '@dylanburkey/astro-blog-cms';

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt?: string;
  content: string;
  cover_image?: string;
  author_id: number;
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  meta_title?: string;
  meta_description?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

interface BlogCategory {
  id: number;
  slug: string;
  name: string;
  description?: string;
  parent_id?: number;
}

interface BlogTag {
  id: number;
  slug: string;
  name: string;
  description?: string;
}
```
