#!/bin/bash

# KYS PostgreSQL Database Setup Script
# Bu script'i çalıştırmadan önce PostgreSQL'in kurulu olduğundan emin olun

echo "KYS PostgreSQL Veritabanı Kurulumu"
echo "=================================="

# PostgreSQL kullanıcısı ve veritabanı oluşturma komutları
# Not: Bu komutları postgres kullanıcısı olarak çalıştırmanız gerekiyor

cat << 'EOF' > /tmp/kys_db_setup.sql
-- KYS kullanıcısını oluştur
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'kys_user') THEN
      CREATE USER kys_user WITH PASSWORD 'kys_password_2024';
   END IF;
END
$do$;

-- KYS veritabanını oluştur
SELECT 'CREATE DATABASE kys_system OWNER kys_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'kys_system')\gexec

-- Kullanıcıya tam yetki ver
GRANT ALL PRIVILEGES ON DATABASE kys_system TO kys_user;
EOF

echo "PostgreSQL kurulum script'i hazırlandı."
echo ""
echo "Veritabanını oluşturmak için aşağıdaki komutu çalıştırın:"
echo "sudo -u postgres psql < /tmp/kys_db_setup.sql"
echo ""
echo "Veritabanı bağlantı bilgileri:"
echo "Host: localhost"
echo "Port: 5432"
echo "Database: kys_system"
echo "User: kys_user"
echo "Password: kys_password_2024"
echo ""
echo "DATABASE_URL formatı:"
echo "postgresql://kys_user:kys_password_2024@localhost:5432/kys_system"