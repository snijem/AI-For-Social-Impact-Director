import { connectDB, queryDB } from './db'

// Track if setup has been completed to avoid repeated logs
let setupCompleted = false
let setupInProgress = false

// Setup database tables if they don't exist
export async function setupDatabase() {
  // If already completed, skip silently
  if (setupCompleted) {
    return true
  }
  
  // If setup is in progress, wait for it to complete
  if (setupInProgress) {
    // Wait a bit and check again
    await new Promise(resolve => setTimeout(resolve, 100))
    if (setupCompleted) return true
  }
  
  setupInProgress = true
  
  try {
    if (!setupCompleted) {
      console.log('Setting up database tables...')
    }
    
    // Create users table
    await queryDB(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(50) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
        INDEX idx_email (email),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)
    console.log('✓ Users table created/verified')

    // Create user_sessions table
    await queryDB(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        session_token VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_session_token (session_token),
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)
    console.log('✓ User sessions table created/verified')

    // Create user_videos table
    await queryDB(`
      CREATE TABLE IF NOT EXISTS user_videos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        script TEXT NOT NULL,
        video_url VARCHAR(500) NULL,
        generation_id VARCHAR(255) NULL,
        status ENUM('draft', 'processing', 'completed', 'failed') DEFAULT 'draft',
        storyboard JSON NULL,
        video_data JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)
    console.log('✓ User videos table created/verified')

    // Create generation_jobs table for async job processing
    await queryDB(`
      CREATE TABLE IF NOT EXISTS generation_jobs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        job_id VARCHAR(255) NOT NULL UNIQUE,
        user_id INT NULL,
        script TEXT NOT NULL,
        status ENUM('queued', 'processing', 'completed', 'failed') DEFAULT 'queued',
        progress INT DEFAULT 0,
        current_step VARCHAR(255) NULL,
        scenes_count INT DEFAULT 0,
        storyboard JSON NULL,
        scenes JSON NULL,
        error_message TEXT NULL,
        error_details JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        completed_at TIMESTAMP NULL,
        INDEX idx_job_id (job_id),
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)
    console.log('✓ Generation jobs table created/verified')

    if (!setupCompleted) {
      console.log('Database setup completed successfully!')
    }
    
    setupCompleted = true
    setupInProgress = false
    return true
  } catch (error) {
    console.error('Database setup error:', error)
    
    // If foreign key constraint fails, try creating tables without foreign keys first
    if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.message.includes('foreign key')) {
      console.log('Retrying without foreign key constraints...')
      try {
        // Drop and recreate sessions table without FK
        await queryDB('DROP TABLE IF EXISTS user_sessions')
        await queryDB(`
          CREATE TABLE IF NOT EXISTS user_sessions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            session_token VARCHAR(255) NOT NULL UNIQUE,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_session_token (session_token),
            INDEX idx_user_id (user_id)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `)

        // Drop and recreate videos table without FK
        await queryDB('DROP TABLE IF EXISTS user_videos')
        await queryDB(`
          CREATE TABLE IF NOT EXISTS user_videos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            script TEXT NOT NULL,
            video_url VARCHAR(500) NULL,
            generation_id VARCHAR(255) NULL,
            status ENUM('draft', 'processing', 'completed', 'failed') DEFAULT 'draft',
            storyboard JSON NULL,
            video_data JSON NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_user_id (user_id),
            INDEX idx_status (status),
            INDEX idx_created_at (created_at)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `)
        console.log('Database setup completed (without foreign keys)!')
        setupCompleted = true
        setupInProgress = false
        return true
      } catch (retryError) {
        console.error('Retry also failed:', retryError)
        setupInProgress = false
        throw retryError
      }
    }
    
    setupInProgress = false
    throw error
  }
}
