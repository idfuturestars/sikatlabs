#!/usr/bin/env node
/**
 * 📦 EIQ™ PROJECT BACKUP GENERATOR
 * Creates comprehensive backup of entire codebase for verification
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

const execAsync = promisify(exec);

async function createProjectBackup() {
  const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const backupName = `eiq-full-feature-verification-${timestamp}`;
  const backupPath = `public/${backupName}.zip`;
  
  console.log('📦 Creating comprehensive project backup...');
  console.log(`Backup name: ${backupName}.zip`);
  
  // Ensure public directory exists
  if (!fs.existsSync('public')) {
    fs.mkdirSync('public', { recursive: true });
  }
  
  // Create archive
  const output = fs.createWriteStream(backupPath);
  const archive = archiver('zip', {
    zlib: { level: 9 } // Maximum compression
  });
  
  return new Promise((resolve, reject) => {
    output.on('close', () => {
      const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
      console.log(`✅ Backup created successfully: ${sizeInMB} MB`);
      console.log(`📍 Location: ${backupPath}`);
      resolve(backupPath);
    });
    
    archive.on('error', (err) => {
      console.error('❌ Archive error:', err);
      reject(err);
    });
    
    archive.pipe(output);
    
    // Add directories and files
    const includePatterns = [
      'client/**/*',
      'server/**/*',
      'shared/**/*',
      'migrations/**/*',
      'public/**/*',
      '*.md',
      '*.json',
      '*.js',
      '*.mjs',
      '*.ts',
      '*.tsx',
      '.env.example',
      '.gitignore',
      '.replit',
      'Dockerfile',
      'docker-compose.yml',
      'app.yaml',
      'components.json',
      'drizzle.config.ts',
      'vite.config.ts',
      'tailwind.config.ts',
      'postcss.config.js'
    ];
    
    const excludePatterns = [
      'node_modules',
      '.git',
      'dist',
      'build',
      '.env',
      '*.log',
      'coverage',
      '.nyc_output',
      'uploads/*'
    ];
    
    // Add files to archive
    includePatterns.forEach(pattern => {
      if (pattern.includes('**')) {
        const basePath = pattern.split('/**')[0];
        if (fs.existsSync(basePath)) {
          archive.directory(basePath, basePath);
        }
      } else if (pattern.includes('*')) {
        // Handle glob patterns
        try {
          archive.glob(pattern, {
            ignore: excludePatterns
          });
        } catch (err) {
          console.warn(`Warning: Could not add pattern ${pattern}`);
        }
      } else {
        // Handle individual files
        if (fs.existsSync(pattern)) {
          archive.file(pattern, { name: pattern });
        }
      }
    });
    
    // Add test results and reports
    const reportFiles = [
      'implementation_report.md',
      'comprehensive-feature-validation-report.json',
      'production-readiness-report.json',
      'FINAL_PRODUCTION_DEPLOYMENT_REPORT.md',
      'CTO_FINAL_PRODUCTION_COMPLIANCE_REPORT.md'
    ];
    
    reportFiles.forEach(file => {
      if (fs.existsSync(file)) {
        archive.file(file, { name: file });
      }
    });
    
    console.log('📝 Adding source code and documentation...');
    console.log('📊 Adding test results and reports...');
    console.log('🗄️ Adding database migrations...');
    console.log('⚙️ Adding configuration files...');
    
    archive.finalize();
  });
}

// Execute backup creation
createProjectBackup().catch(error => {
  console.error('❌ Backup creation failed:', error);
  process.exit(1);
});