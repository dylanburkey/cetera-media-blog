-- Create blog post engagement table
CREATE TABLE IF NOT EXISTS blog_post_engagement (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id),
  FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE
);

-- Create blog comments table
CREATE TABLE IF NOT EXISTS blog_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT 0,
  parent_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES blog_comments(id) ON DELETE CASCADE
);

-- Create blog likes table (track individual likes)
CREATE TABLE IF NOT EXISTS blog_likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  user_identifier TEXT NOT NULL, -- Can be session ID or IP hash
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, user_identifier),
  FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_blog_engagement_post_id ON blog_post_engagement(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_post_id ON blog_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_approved ON blog_comments(is_approved);
CREATE INDEX IF NOT EXISTS idx_blog_likes_post_id ON blog_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_engagement_views ON blog_post_engagement(views DESC);

-- Initialize engagement data for existing posts
INSERT OR IGNORE INTO blog_post_engagement (post_id, views, likes)
SELECT id, 
       CAST(RANDOM() % 1000 + 100 AS INTEGER) as views,  -- Random views between 100-1100
       CAST(RANDOM() % 50 + 5 AS INTEGER) as likes        -- Random likes between 5-55
FROM blog_posts;