-- Create databases for services
CREATE DATABASE user_db;
CREATE DATABASE keycloak;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE user_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE keycloak TO postgres;

-- Connect to user_db and create initial schema
\c user_db;

-- Note: Tables will be auto-created by Hibernate, but you can add initial data here if needed
-- Example: INSERT INTO users (keycloak_id, email, first_name, last_name) VALUES (...);



